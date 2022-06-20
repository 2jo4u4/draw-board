import {
  BaseShape,
  Board,
  BoardShapeLog,
  UtilTools,
  UserAction,
  ImageShape,
  PDFShape,
  Rect,
} from ".";

export type PageData = Map<string, BoardShapeLog>;
export type DataType =
  | Record<string | keyof ReceviceData, unknown>
  | Record<string | keyof ReceviceData, unknown>[];
export type DrawData = PenData | ImageData | PdfData;
export interface ReceviceData {
  pen: PenData;
  image: ImageData;
  pdf: PdfData;
}

export interface ReceviceSyncBase
  extends Record<string | keyof ReceviceData, unknown> {
  objectid: string;
  tools: "pen" | "pdf" | "image";
  type: "new" | "confirmobject";
  application: string;
  request_datetime: string;
  wbid: string;
  pageid: string;
  teamid: string;
  accountid: string;
  transform: string;
  socketid: string;
}

export interface PenData extends ReceviceSyncBase {
  linewidth: string;
  linecolor: string;
  lineopacity: string;
  children: {
    parentid: string;
    tools: string;
    type: string;
    x: string;
    y: string;
  }[];
}

export interface FileData extends ReceviceSyncBase {
  objecturl: string;
  x1: string;
  y1: string;
  width: string;
  height: string;
}

export interface ImageData extends FileData {}
export interface PdfData extends FileData {
  pagenumber: string;
}

export interface SendData {
  type: UserAction;
  bss: BaseShape[];
  v: Vec2;
}

export enum SendEvent {
  // onwer / editer / viewer
  "訂閱hub" = "subscribe",
  "加入" = "join",
  "離開" = "exit",
  // onwer
  "刪除Session" = "delete",
  "剔除人員" = "forcedisconnect",
  "更新SessionCode" = "refreshdisconnect",
  "變更人員權限" = "change",
  "變更群組人員權限" = "changegroup",
  // onwer / editer
  "廣播操作" = "broadcast",
  "redis" = "json",
}

export enum ReceivceEvent {
  "通知" = "notice",
  "同步" = "sync",
  "被廣播操作" = "broadcast",
  "伺服器" = "hub",
  "未知" = "unknown", // 前端無法解析事件
}

/**
 * 網路插件
 */
export abstract class SocketMiddle {
  /** 傳送資料 */
  abstract postData(action: unknown): void;
  /** 接收資料 */
  abstract receviceData(v: unknown): void;
}

const regexp = new RegExp(/^([0-9]*)((\[")([a-zA-Z]*)(",)([\S\s]*)(]))?/);
export class DemoSocket implements SocketMiddle {
  readonly socket: WebSocket;
  readonly board: Board;

  isReady = false;
  pageId!: string;
  pageData: PageData = new Map<string, BoardShapeLog>();

  constructor(url: string, canvas: HTMLCanvasElement | string) {
    this.socket = new WebSocket(url);
    this.board = new Board(canvas, { Socket: this });
  }

  postData(action: SendData): void {
    switch (action.type) {
      case UserAction.刪除圖形:
        this.deleteShape(action.bss);
        break;
      case UserAction.下筆:
        break;
      case UserAction.提筆:
        break;
      case UserAction.筆移動:
        break;
      case UserAction.選取圖形:
        break;
      case UserAction.變形開始:
        break;
      case UserAction.變形:
        break;
      case UserAction.變形結束:
        break;
      default:
        break;
    }
  }

  destroy() {
    this.board.destroy();
    this.socket.close();
  }

  protected deleteShape(bss: BaseShape[]) {
    const ids = bss.map((bs) => bs.id);
    ids.forEach((id) => {
      const post = [
        "broadcast",
        {
          accountid: "",
          application: "",
          objectid: id,
          ot: "",
          pageid: "",
          request_datetime: "",
          socketid: "",
          teamid: "",
          tools: "",
          wbid: "",
        },
      ];
    });
  }

  receviceData(message: MessageEvent<string>): void {
    const { number, event, data } = this.messageFormat(message.data);
    switch (event) {
      case "unknown":
        if (number === 2) {
          this.socket.send("3");
        }
        break;
      case "sync":
        {
          this.dataToCanvas(data as DrawData[]);
        }
        break;
      default:
        break;
    }
  }

  protected dataToCanvas<T extends DrawData>(data: T[]) {
    let bs: BaseShape | null = null;
    data.forEach((item) => {
      switch (item.tools) {
        case "pdf":
          bs = this.toPdfShape(item as PdfData);
          break;
        case "image":
          bs = this.toImageShape(item as ImageData);
          break;
        case "pen":
          bs = this.toBaseShape(item as PenData);
          break;
        default:
          bs = null;
          break;
      }
      bs && this.board.addShapeByBs(bs);
    });
  }

  protected messageFormat(s: string): {
    number: number;
    event: ReceivceEvent;
    data: DataType;
  } {
    let number = -1;
    let event = ReceivceEvent.未知;
    let data: DataType = {};
    s.replace(
      regexp,
      (
        os: string,
        _number: string,
        p2?: string,
        p3?: string,
        _event?: ReceivceEvent,
        p4?: string,
        _data?: string
      ) => {
        number = Number(_number);
        _event && (event = _event);
        _data && (data = JSON.parse(_data));

        return os;
      }
    );

    return { number, event, data };
  }

  protected toBaseShape(data: PenData): BaseShape {
    const p = new Path2D(),
      [p1, ...ps] = data.children,
      s: Styles = {
        lineColor: data.linecolor,
        lineWidth: parseInt(data.linewidth),
        lineDash: [],
      },
      x = parseInt(p1.x),
      y = parseInt(p1.y),
      matrix = this.getMatrix(data.transform);
    let minRect: MinRectVec = {
      leftTop: { x, y },
      rightBottom: { x, y },
    };

    p.moveTo(x, y);

    ps.forEach((point) => {
      const x = parseInt(point.x);
      const y = parseInt(point.y);
      p.lineTo(x, y);
      minRect = UtilTools.newMinRect({ x, y }, minRect);
    });

    const bs = new BaseShape(
      data.objectid,
      this.board,
      p,
      s,
      new Rect(minRect),
      matrix
    );
    return bs;
  }

  protected toImageShape(data: ImageData): ImageShape {
    const image = new ImageShape(
      data.objectid,
      this.board,
      data.objecturl,
      this.getMatrix(data.transform)
    );
    return image;
  }

  protected toPdfShape(data: PdfData): PDFShape {
    const pdf = new PDFShape(
      data.objectid,
      this.board,
      data.objecturl,
      this.getMatrix(data.transform)
    );
    return pdf;
  }

  protected getMatrix(t: string) {
    const [a = 1, c = 0, e = 0, b = 0, d = 1, f = 0] = t
      .split(",")
      .map((s) => parseFloat(s));

    return new DOMMatrix([a, b, c, d, e, f]);
  }

  protected getMatrixString(m: DOMMatrix) {
    const a = m.a,
      b = m.b,
      c = m.c,
      d = m.d,
      e = m.e,
      f = m.f;
    return `${a},${c},${e},${b},${d},${f},0.0,0.0,1.0`;
  }
}
