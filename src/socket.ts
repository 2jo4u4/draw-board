import type { BoardShapeLog, Styles, Vec2, MinRectVec } from ".";
import {
  BaseShape,
  Board,
  UtilTools,
  UserAction,
  Rect,
  ToolsManagement,
  ImageShape,
  PDFShape,
  initialPageId,
} from ".";

type AcountId = string;
type PageId = string;
export type PageData = Map<PageId, BoardShapeLog>;
export type ToolsData = PageData;
export type OtherManager = Map<PageId, Map<AcountId, ToolsManagement>>;
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
  abstract get toolsShapes(): BoardShapeLog | undefined;
  abstract get shapes(): BoardShapeLog | undefined;
  abstract postData(action: SendData): void;
  abstract messageFormat(v: string): {
    number: number;
    event: ReceivceEvent;
    data: DataType;
  };
  abstract addBaseShape(pageid: string, bs: BaseShape): void;
  abstract addToolsShape(pageid: string, bs: BaseShape): void;
  abstract deleteBaseShape(pageid: string, bss: BaseShape[]): void;
  abstract removeToolsShape(pageid: string, bs: BaseShape): void;
  abstract localManagerEnter(manager: ToolsManagement): void;
}

const regexp = new RegExp(/^([0-9]*)((\[")([a-zA-Z]*)(",)([\S\s]*)(]))?/);
export class DemoSocket implements SocketMiddle {
  readonly board: Board;
  readonly otherManager: OtherManager;
  readonly pageShapes: PageData;
  readonly pageToolsShapes: ToolsData;
  private localManager!: ToolsManagement;
  pageId: string;

  constructor(canvas: HTMLCanvasElement | string) {
    this.pageShapes = new Map();
    this.otherManager = new Map();
    this.pageToolsShapes = new Map();
    this.pageId = initialPageId;

    this.board = new Board(canvas, { Socket: this });
  }

  get toolsShapes(): BoardShapeLog | undefined {
    return this.pageToolsShapes.get(this.pageId);
  }

  get shapes(): BoardShapeLog | undefined {
    return this.pageShapes.get(this.pageId);
  }

  findManagerInstance(accountid: string): ToolsManagement | undefined {
    return Array.from(this.otherManager)
      .find(([pageid, instance]) => instance.has(accountid))?.[1]
      .get(accountid);
  }

  addAnyShape(type: "common" | "special", pageid: string, bs: BaseShape) {
    const maps = type === "special" ? this.pageToolsShapes : this.pageShapes;
    if (maps.has(pageid)) {
      (maps.get(pageid) as BoardShapeLog).set(bs.id, bs);
    } else {
      maps.set(pageid, new Map([[bs.id, bs]]));
    }
  }

  addBaseShape(pageid: string, bs: BaseShape) {
    this.addAnyShape("common", pageid, bs);
  }

  deleteBaseShape(pageid: string, shapes: BaseShape[]) {
    shapes.forEach((bs) => {
      bs.isDelete = true;
    });
  }

  addToolsShape(pageid: string, bs: BaseShape): void {
    this.addAnyShape("special", pageid, bs);
  }

  localManagerEnter(manager: ToolsManagement) {
    this.localManager = manager;
  }

  removeToolsShape(pageid: string, bs: BaseShape) {
    this.pageToolsShapes.get(pageid)?.delete(bs.id);
  }

  otherManagerChangePage(accountid: string, pageid: string) {
    this.findManagerInstance(accountid)?.changePage(pageid);
  }

  managerEnterSession(accountid: string, pageid: string) {
    if (!this.otherManager.has(pageid)) {
      const tools = new ToolsManagement(this.board, accountid, pageid);
      tools.switchTypeToSelect();
      this.otherManager.set(pageid, new Map([[accountid, tools]]));
    }
  }

  managerLeaveSession(accountid: string) {
    const managers = Array.from(this.otherManager);
    for (let index = 0; index < managers.length; index++) {
      const [pageid, manager] = managers[index];
      if (manager.delete(accountid)) break;
    }
  }

  changePage(id: string) {
    this.pageId = id;
    this.localManager.changePage(id);
  }

  addNewPage(id: string) {
    if (!this.pageShapes.has(id)) {
      this.pageShapes.set(id, new Map());
    }
    this.localManager.changePage(id);
  }

  postData(action: SendData): void {
    switch (action.type) {
      case UserAction["刪除圖形(用選擇器刪除)"]:
        break;
      case UserAction["筆(開始)"]:
        break;
      case UserAction["筆(移動)"]:
        break;
      case UserAction["筆(結束)"]:
        break;
      case UserAction["選取圖形(開始)"]:
        break;
      case UserAction["選取圖形(結束)"]:
        break;
      case UserAction["變形(開始)"]:
        break;
      case UserAction["變形(過程)"]:
        break;
      case UserAction["變形(結束)"]:
        break;
      default:
        break;
    }
  }

  destroy() {
    this.board.destroy();
  }

  protected dataToCanvas<T extends DrawData>(data: T[]) {
    data.forEach((item) => {
      switch (item.tools) {
        case "pdf":
          this.toPdfShape(item as PdfData);
          break;
        case "image":
          this.toImageShape(item as ImageData);
          break;
        case "pen":
          this.toBaseShape(item as PenData);
          break;
        default:
          break;
      }
    });
  }

  messageFormat(s: string): {
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

  protected toBaseShape(data: PenData) {
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

    this.addBaseShape(data.pageid, bs);
  }

  protected toImageShape(data: ImageData) {
    const bs = new ImageShape(data.objectid, this.board, data.objecturl, {
      x: parseInt(data.x1),
      y: parseInt(data.y1),
      width: parseInt(data.width),
      height: parseInt(data.height),
      transform: this.getMatrix(data.transform),
    });

    this.addBaseShape(data.pageid, bs);
  }

  protected toPdfShape(data: PdfData) {
    const bs = new PDFShape(data.objectid, this.board, data.objecturl, {
      x: parseInt(data.x1),
      y: parseInt(data.y1),
      width: parseInt(data.width),
      height: parseInt(data.height),
      transform: this.getMatrix(data.transform),
    });
    this.addBaseShape(data.pageid, bs);
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
