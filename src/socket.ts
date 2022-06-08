import { BaseShape, Board, BoardShapeLog, UtilTools, UserAction } from ".";
import { ImageShape } from "./shape/image";
type PageData = Map<string, BoardShapeLog>;

interface ReceviceData {
  pen: PenData;
  image: ImageData;
  pdf: PdfData;
}

interface ReceviceSyncBase {
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

interface PenData extends ReceviceSyncBase {
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

interface FileData extends ReceviceSyncBase {
  objecturl: string;
  x1: string;
  y1: string;
  width: string;
  height: string;
}

interface ImageData extends FileData {}
interface PdfData extends FileData {
  pagenumber: string;
}

interface SendData {
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

export enum ReceivceEnent {
  "通知" = "notice",
  "同步" = "sync",
  "被廣播操作" = "broadcast",
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

export class DemoSocket implements SocketMiddle {
  readonly socket: WebSocket;
  readonly board: Board;

  isReady = false;
  pageId!: string;
  pageData: PageData = new Map<string, BoardShapeLog>();

  constructor(url: string, canvas: HTMLCanvasElement) {
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

  receviceData(v: unknown): void {}

  protected toBaseShape(board: Board, data: PenData): BaseShape {
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

    const bs = new BaseShape(data.objectid, board, p, s, minRect, matrix);
    return bs;
  }

  protected toImageShape(board: Board, data: ImageData): ImageShape {
    const matrix = this.getMatrix(data.transform);
    const image = new ImageShape(data.objectid, board, data.objecturl, matrix);
    return image;
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
