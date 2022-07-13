import { BoardShapeLog, Styles, Vec2, MinRectVec, SelectSolidRect } from ".";
import {
  BaseShape,
  Board,
  UtilTools,
  UserAction,
  Rect,
  ToolsManagement,
  ImageShape,
  PDFShape,
} from ".";

type AcountId = string;
type PageId = string;
export type PageRollData = Map<PageId, PageRoll>;
export type PageShapesData = Map<PageId, BoardShapeLog>;
export type ToolsData = PageShapesData;
export type OtherManager = Map<AcountId, ToolsManagement>;
export type DataType =
  | Record<string | keyof ReceviceData, unknown>
  | Record<string | keyof ReceviceData, unknown>[];
export type DrawData = PenData | ImageData | PdfData;
export interface CanvasStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
}
export interface ReceviceData {
  pen: PenData;
  image: ImageData;
  pdf: PdfData;
}

export interface ShapeBase {
  objectid: string;
  transform: DOMMatrix;
}

export interface PenData extends ShapeBase {
  linecolor: string;
  linewidth: number;
  lineopacity: number;
  children: {
    x: number | string;
    y: number | string;
  }[];
}

export interface FileData extends ShapeBase {
  objecturl: string;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

export interface ImageData extends FileData {}
export interface PdfData extends FileData {
  pagenumber: number;
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
  abstract clearAllPageShape(): void;
}

const regexp = new RegExp(/^([0-9]*)([\s\S]*)?/);
export class Socket implements SocketMiddle {
  readonly board: Board;
  readonly otherManager: OtherManager;
  readonly pageShapes: PageShapesData;
  readonly pageRolls: PageRollData;
  readonly pageToolsShapes: ToolsData;
  get localManager() {
    return this.board.localManager;
  }
  get pageId() {
    return this.board.localManager.pageid;
  }
  get toolsShapes(): BoardShapeLog | undefined {
    return this.pageToolsShapes.get(this.pageId);
  }
  get shapes(): BoardShapeLog | undefined {
    return this.pageShapes.get(this.pageId);
  }
  /** @return [pageid, element][] */
  get pageRollArray() {
    return Array.from(this.pageRolls);
  }
  private __pageRollIsFreeze = true;
  get pageRollIsFreeze() {
    return this.__pageRollIsFreeze;
  }
  set pageRollIsFreeze(b: boolean) {
    this.pageRollArray.forEach(([pageid, pageroll]) => {
      pageroll.freeze = b;
    });
    this.__pageRollIsFreeze = b;
  }

  constructor(canvas: HTMLCanvasElement | string) {
    this.pageShapes = new Map();
    this.otherManager = new Map();
    this.pageToolsShapes = new Map();
    this.pageRolls = new Map();

    this.board = new Board(canvas, { Socket: this });
  }

  findManagerInstance(accountid: string): ToolsManagement | undefined {
    return this.otherManager.get(accountid);
  }

  addAnyShape(type: "common" | "special", pageid: string, bs: BaseShape) {
    const maps = type === "special" ? this.pageToolsShapes : this.pageShapes;
    if (maps.has(pageid)) {
      (maps.get(pageid) as BoardShapeLog).set(bs.id, bs);
    } else {
      maps.set(pageid, new Map([[bs.id, bs]]));
    }
    if (type === "common") {
      if (!this.pageRolls.has(pageid)) {
        this.pageRolls.set(
          pageid,
          new PageRoll(this, pageid, this.__pageRollIsFreeze)
        );
      }
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

  deleteBaseShapeById(pageid: string, id: string) {
    const bss: BaseShape[] = [];
    this.pageShapes.get(pageid)?.forEach((shapes, _id) => {
      if (_id === id) {
        bss.push(shapes);
      }
    });
    this.deleteBaseShape(pageid, bss);
  }

  clearAllPageShape() {
    this.pageShapes.get(this.pageId)?.clear();
  }

  addToolsShape(pageid: string, bs: BaseShape): void {
    this.addAnyShape("special", pageid, bs);
  }

  removeToolsShape(pageid: string, bs: BaseShape) {
    this.pageToolsShapes.get(pageid)?.delete(bs.id);
  }

  otherManagerChangePage(accountid: string, pageid: string) {
    this.findManagerInstance(accountid)?.changePage(pageid);
  }

  managerEnterSession(accountid: string, username: string) {
    if (!this.otherManager.has(accountid)) {
      this.otherManager.set(
        accountid,
        new ToolsManagement(this.board, accountid, this.pageId, username)
      );
    }
  }

  managerLeaveSession(accountid: string) {
    this.otherManager.delete(accountid);
  }

  changePage(pageid: string) {
    this.checkPageIdExist(pageid);
    this.localManager.changePage(pageid);
  }

  changePageOtherManager(accountid: string, nextPageid: string) {
    const manager = this.otherManager.get(accountid);
    if (manager) {
      manager.changePage(nextPageid);
    } else {
      console.warn("not found manager id", accountid);
    }
  }

  private checkPageIdExist(pageid: string) {
    if (!this.pageRolls.has(pageid)) {
      this.pageRolls.set(
        pageid,
        new PageRoll(this, pageid, this.__pageRollIsFreeze)
      );
    }
    if (!this.pageShapes.has(pageid)) {
      this.pageShapes.set(pageid, new Map());
    }
    if (!this.pageToolsShapes.has(pageid)) {
      this.pageToolsShapes.set(pageid, new Map());
    }
  }

  initialPage(pageid: string) {
    this.checkPageIdExist(pageid);
  }

  addNewPageBySelf(pageid: string) {
    this.checkPageIdExist(pageid);
    (this.pageRolls.get(pageid) as PageRoll).setInLineStyle({
      backgroundColor: this.board.rootBlock.style.backgroundColor,
      backgroundImage: this.board.rootBlock.style.backgroundImage,
    });
    this.localManager.changePage(pageid);
  }

  addNewPageByOther(pageid: string, account: string) {
    this.checkPageIdExist(pageid);
    this.findManagerInstance(account)?.changePage(pageid);
  }

  setBoardInLineStyle(style: CanvasStyle) {
    const {
      backgroundImage,
      backgroundColor,
      backgroundPosition = "center",
      backgroundRepeat = "no-repeat",
    } = style;
    backgroundColor &&
      (this.board.rootBlock.style.backgroundColor = backgroundColor);
    backgroundImage &&
      (this.board.rootBlock.style.backgroundImage = backgroundImage);
    this.board.rootBlock.style.backgroundPosition = backgroundPosition;
    this.board.rootBlock.style.backgroundRepeat = backgroundRepeat;
  }

  setPageRollInLineStyle(pageid: string, style: CanvasStyle) {
    this.pageRolls.get(pageid)?.setInLineStyle(style);
  }

  deletePage(pageid: string) {
    this.pageRolls.delete(pageid);
    this.pageShapes.delete(pageid);
    this.pageToolsShapes.delete(pageid);
  }

  postData(action: SendData): void {
    if (action.type !== UserAction.純移動) {
      // console.log(UserAction[action.type], action);
    }
  }

  destroy() {
    this.pageRolls.forEach((item) => {
      item.destory();
    });
    this.pageRolls.clear();
    this.pageShapes.clear();
    this.pageToolsShapes.clear();
    this.board.destroy();
  }

  messageFormat(s: string): {
    number: number;
    event: ReceivceEvent;
    data: DataType;
  } {
    let number = -1;
    let event = ReceivceEvent.未知;
    let data: DataType = {};
    s.replace(regexp, (os: string, _number: string, _d?: string) => {
      number = Number(_number);
      if (_d) {
        const d = JSON.parse(_d);
        if (Array.isArray(d)) {
          event = d[0];
          data = d[1];
        } else {
          data = d;
        }
      }

      return os;
    });

    return { number, event, data };
  }

  protected toBaseShape(pageid: string, data: PenData) {
    const p = new Path2D(),
      [p1, ...ps] = data.children,
      s: Styles = {
        lineColor: data.linecolor,
        lineWidth: data.linewidth,
        lineDash: [],
        opacity: data.lineopacity,
      },
      x = parseInt(p1.x as string),
      y = parseInt(p1.y as string),
      matrix = data.transform;
    let minRect: MinRectVec = {
      leftTop: { x, y },
      rightBottom: { x, y },
    };

    p.moveTo(x, y);

    ps.forEach((point) => {
      const x = parseInt(point.x as string);
      const y = parseInt(point.y as string);
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

    this.addBaseShape(pageid, bs);
  }

  protected toImageShape(pageid: string, data: ImageData) {
    const bs = new ImageShape(data.objectid, this.board, data.objecturl, {
      x: data.x1,
      y: data.y1,
      width: data.width,
      height: data.height,
      transform: data.transform,
    });

    this.addBaseShape(pageid, bs);
  }

  protected toPdfShape(pageid: string, data: PdfData) {
    const bs = new PDFShape(data.objectid, this.board, data.objecturl, {
      x: data.x1,
      y: data.y1,
      width: data.width,
      height: data.height,
      transform: data.transform,
    });
    this.addBaseShape(pageid, bs);
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

/**
 * @deprecated 變更命名為 Socket
 */
export const DemoSocket = Socket;
export class PageRoll {
  private cancelLoopId: number | null = null;
  private socket: Socket;
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private pageid: string;
  private __freeze!: boolean;
  get freeze() {
    return this.__freeze;
  }
  set freeze(b: boolean) {
    this.__freeze = b;
    if (this.__freeze) {
      this.cancelLoopId && cancelAnimationFrame(this.cancelLoopId);
      this.cancelLoopId = null;
    } else {
      this.cancelLoopId = requestAnimationFrame(this.render.bind(this));
    }
  }
  get HTMLElement() {
    return this.canvas;
  }
  constructor(socket: Socket, pageid: string, freeze = false) {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.socket = socket;
    this.pageid = pageid;
    this.freeze = freeze;
  }

  setInLineStyle(style: CanvasStyle) {
    if (this.canvas) {
      const {
        backgroundImage,
        backgroundColor,
        backgroundPosition = "center",
        backgroundRepeat = "no-repeat",
      } = style;
      backgroundColor && (this.canvas.style.backgroundColor = backgroundColor);
      backgroundImage && (this.canvas.style.backgroundImage = backgroundImage);
      this.canvas.style.backgroundPosition = backgroundPosition;
      this.canvas.style.backgroundRepeat = backgroundRepeat;
    }
  }

  private render(t: number) {
    if (!this.freeze) {
      const [width, height] = this.socket.board.size;
      const canvas = this.canvas as HTMLCanvasElement;
      canvas.width = width;
      canvas.height = height;
      const ctx = this.ctx as CanvasRenderingContext2D;
      this.socket.pageShapes.get(this.pageid)?.forEach((bs) => {
        if (!bs.isDelete) {
          UtilTools.injectStyle(ctx, bs.style);
          if (
            (bs instanceof ImageShape || bs instanceof PDFShape) &&
            bs.isLoad
          ) {
            const { x, y } = bs.coveredRect.nw;
            const [width, height] = bs.coveredRect.size;
            ctx.setTransform(bs.matrix);
            ctx.drawImage(bs.htmlEl, x, y, width, height);
          } else if (bs instanceof SelectSolidRect) {
          } else {
            if (bs.style.fillColor) {
              ctx.fill(bs.pathWithMatrix);
            } else {
              ctx.stroke(bs.pathWithMatrix);
            }
          }
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      });
      this.cancelLoopId = requestAnimationFrame(this.render.bind(this));
    }
  }

  destory() {
    this.cancelLoopId && cancelAnimationFrame(this.cancelLoopId);
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
  }
}
