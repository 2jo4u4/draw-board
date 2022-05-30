import { BaseShape, SocketMiddle, ToolsManagement, UtilTools } from ".";

type MouseFlag = "active" | "inactive"; // 滑鼠左鍵 活躍 / 非活躍
type Action = "draw" | "delete" | "move" | "rotate" | "zoom"; // 可被紀錄的行為
export type BoardShapeLog = Map<string, BaseShape>;
interface ActionStore {
  type: Action;
  actionNumber: number;
  shapeId: string[];
}

/**
 * 繪圖板，介接各個插件
 */
export class Board {
  private __rootBlock!: HTMLDivElement;
  get rootBlock(): HTMLDivElement {
    return this.__rootBlock;
  }
  /** Canvas網頁元素（事件層級） */
  private __canvas: HTMLCanvasElement;
  get canvas(): HTMLCanvasElement {
    return this.__canvas;
  }
  /** 繪版物件（事件層級）  */
  private __ctx: CanvasRenderingContext2D;
  get ctx(): CanvasRenderingContext2D {
    return this.__ctx;
  }
  /** 圖層級 */
  private __canvasStatic!: HTMLCanvasElement;
  get canvasStatic(): HTMLCanvasElement {
    return this.__canvasStatic;
  }
  private __ctxStatic!: CanvasRenderingContext2D;
  get ctxStatic(): CanvasRenderingContext2D {
    return this.__ctxStatic;
  }

  /** 滑鼠旗標（是否點擊） */
  private mouseFlag: MouseFlag = "inactive";
  /** 像素密度 */
  readonly decivePixelPatio!: number;
  /** 所有被繪製的圖形 */
  private __shapes: BoardShapeLog = new Map<string, BaseShape>();
  get shapes(): BoardShapeLog {
    return this.__shapes;
  }
  /** 紀錄行為 */
  __actionStore: ActionStore[] = [];
  get actionStore(): ActionStore[] {
    return this.__actionStore;
  }
  /** 可記錄步驟總數 */
  readonly actionStoreLimit = 10;
  /** 計數器 */
  actionStoreCount = 0;

  /** 工具包中間件 */
  private __tools: ToolsManagement;
  get toolsCtrl() {
    return this.__tools;
  }
  /** 網路請求中間件 */
  private __socket: SocketMiddle | null = null;
  get socketCtrl() {
    return this.__socket;
  }

  constructor(
    canvas: HTMLCanvasElement | string,
    config?: {
      Socket?: SocketMiddle;
      Tools?: typeof ToolsManagement;
    }
  ) {
    this.__canvas = getCnavasElement(canvas);
    this.__ctx = checkCanvasContext(this.__canvas);
    this.setStaticCanvas();
    const { Socket, Tools = ToolsManagement } = Object.assign({}, config);
    this.__tools = new Tools(this);
    this.__socket = Socket || null;
    this.decivePixelPatio = window.devicePixelRatio;

    this.initial();
    this.addListener();
  }

  /** 清除指定畫布(若無指定則清除兩畫布) */
  clearCanvas(type?: "static" | "event") {
    const { width, height } = this.canvasStatic;
    type !== "static" && this.ctx.clearRect(0, 0, width, height);
    type !== "event" && this.ctxStatic.clearRect(0, 0, width, height);
  }
  /** 取得圖形物件 */
  getShapeById(id: string): BaseShape | undefined {
    return this.shapes.get(id);
  }
  /** 添加圖形到圖層級 & 紀錄 */
  addShape(p: Path2D, s: Styles, m: MinRectVec) {
    const id = UtilTools.RandomID(Array.from(this.shapes.keys())),
      bs = new BaseShape(id, this, p, s, m);
    this.shapes.set(id, bs);
    this.logAction("draw", id);
    this.rerenderToPaint({ bs });
  }
  /** 刪除已選圖形 */
  deleteShape() {
    const id: string[] = [];
    this.shapes.forEach((bs) => {
      if (bs.isSelect) {
        id.push(bs.id);
        bs.isDelete = true;
      }
    });
    this.logAction("delete", ...id);
    this.rerender();
  }
  /** 重新繪製事件層 */
  rerenderToEvent(v: {
    needClear?: boolean;
    bs?: { p: Path2D; s: Styles } | BaseShape;
  }) {
    const { needClear, bs } = v;
    Boolean(needClear) && this.clearCanvas("event");
    if (bs) {
      if (UtilTools.isBaseShape(bs)) {
        UtilTools.injectStyle(this.ctx, bs.style);
        this.ctx.stroke(bs.path);
      } else {
        UtilTools.injectStyle(this.ctx, bs.s);
        this.ctx.stroke(bs.p);
      }
    } else {
      this.shapes.forEach((_bs) => {
        if (!_bs.isDelete && _bs.isSelect) {
          UtilTools.injectStyle(this.ctx, _bs.style);
          this.ctx.stroke(_bs.path);
        }
      });
    }
  }
  /** 重新繪製圖層 */
  rerenderToPaint(v: { needClear?: boolean; bs?: BaseShape }) {
    const { needClear, bs } = v;
    Boolean(needClear) && this.clearCanvas("static");
    if (bs) {
      UtilTools.injectStyle(this.ctxStatic, bs.style);
      this.ctxStatic.stroke(bs.path);
    } else {
      this.shapes.forEach((_bs) => {
        if (!_bs.isDelete && !_bs.isSelect) {
          UtilTools.injectStyle(this.ctxStatic, _bs.style);
          this.ctxStatic.stroke(_bs.path);
        }
      });
    }
  }
  /** 重新繪製所有層 */
  rerender() {
    this.clearCanvas();
    this.shapes.forEach((bs) => {
      if (!bs.isDelete) {
        if (bs.isSelect) {
          this.rerenderToEvent({ bs });
        } else {
          this.rerenderToPaint({ bs });
        }
      }
    });
  }
  /** 紀錄行為 */
  logAction(type: Action, ...id: string[]) {
    const actionNumber = this.actionStoreCount++;
    this.actionStore.push({ type, actionNumber, shapeId: id });
    if (this.actionStore.length > this.actionStoreLimit) {
      const [store, ...other] = this.actionStore;
      this.__actionStore = other;
      if (store.type === "delete") {
        store.shapeId.forEach((id) => {
          const bs = this.getShapeById(id);
          if (bs && bs.isDelete) {
            this.shapes.delete(id);
          }
        });
      }
    }
  }
  /** 變更Page */
  changePage(shapes: BoardShapeLog) {
    this.__shapes = shapes;
    this.rerender();
  }

  /** 上一步 */
  undo() {}
  /** 下一步 */
  redo() {}

  /** 初始化 canvas */
  private initial() {
    this.settingChild();
  }

  destroy() {
    this.removeListener();
  }

  private setStaticCanvas() {
    this.__canvasStatic = getCnavasElement();
    this.__ctxStatic = checkCanvasContext(this.canvasStatic);
  }

  private addListener() {
    this.canvas.addEventListener("mousedown", this.onEventStart.bind(this));
    this.canvas.addEventListener("touchstart", this.onEventStart.bind(this));

    this.canvas.addEventListener("mousemove", this.onEventMove.bind(this));
    this.canvas.addEventListener("touchmove", this.onEventMove.bind(this));

    this.canvas.addEventListener("mouseup", this.onEventEnd.bind(this));
    this.canvas.addEventListener("mouseleave", this.onEventEnd.bind(this));
    this.canvas.addEventListener("touchend", this.onEventEnd.bind(this));
    this.canvas.addEventListener("touchcancel", this.onEventEnd.bind(this));

    window.addEventListener("resize", this.resizeCanvas.bind(this));
  }

  private removeListener() {
    this.canvas.removeEventListener("mousedown", this.onEventStart.bind(this));
    this.canvas.removeEventListener("touchstart", this.onEventStart.bind(this));

    this.canvas.removeEventListener("mousemove", this.onEventMove.bind(this));
    this.canvas.removeEventListener("touchmove", this.onEventMove.bind(this));

    this.canvas.removeEventListener("mouseup", this.onEventEnd.bind(this));
    this.canvas.removeEventListener("mouseleave", this.onEventEnd.bind(this));
    this.canvas.removeEventListener("touchend", this.onEventEnd.bind(this));
    this.canvas.removeEventListener("touchcancel", this.onEventEnd.bind(this));

    window.removeEventListener("resize", this.resizeCanvas.bind(this));
  }

  private onEventStart(event: TouchEvent | MouseEvent) {
    if (this.mouseFlag === "inactive") {
      this.mouseFlag = "active";
      const position = this.eventToPosition(event);
      this.toolsCtrl.onEventStart(position);
    }
  }

  private onEventMove(event: TouchEvent | MouseEvent) {
    const position = this.eventToPosition(event);
    if (this.mouseFlag === "active") {
      this.toolsCtrl.onEventMoveActive(position);
    } else {
      this.toolsCtrl.onEventMoveInActive(position);
    }
    // if (this.socketCtrl) {
    //   this.socketCtrl.postData();
    // }
  }

  private onEventEnd(event: TouchEvent | MouseEvent) {
    if (this.mouseFlag === "active") {
      this.mouseFlag = "inactive";
      const position = this.eventToPosition(event);
      this.toolsCtrl.onEventEnd(position);
    }
  }

  /** 事件轉換canvas座標 */
  private eventToPosition(event: TouchEvent | MouseEvent): Vec2 {
    let x = 0,
      y = 0;
    if (UtilTools.isMouseEvent(event)) {
      x = event.clientX;
      y = event.clientY;
    } else {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    }
    const { left, top, width, height } = this.canvas.getBoundingClientRect();

    const back = {
      x:
        ((x - left) / (this.canvas.width / this.decivePixelPatio / width)) *
        this.decivePixelPatio,
      y:
        ((y - top) / (this.canvas.height / this.decivePixelPatio / height)) *
        this.decivePixelPatio,
    };

    return back;
  }

  private resizeCanvas() {
    // 清除畫面
    this.clearCanvas();
    // 設定大小
    this.setCanvasStyle(this.canvas);
    this.setCanvasStyle(this.canvasStatic);
    this.rerender();
  }

  private setCanvasStyle(el: HTMLCanvasElement) {
    const clientWidth = window.innerWidth;
    const clientHeight = window.innerHeight;
    el.setAttribute("width", `${clientWidth * this.decivePixelPatio}px`);
    el.setAttribute("height", `${clientHeight * this.decivePixelPatio}px`);
    el.style.width = `${clientWidth}px`;
    el.style.height = `${clientHeight}px`;
  }

  /** 調整使用者給予的 Canvas */
  private settingChild() {
    this.__rootBlock = document.createElement("div");
    this.rootBlock.style.position = "relative";
    this.rootBlock.style.overflow = "hidden";
    this.rootBlock.classList.add("canvasRoot");
    this.canvas.after(this.rootBlock);
    this.setCanvasStyle(this.canvas);
    this.canvas.classList.add("event_paint");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
    this.setCanvasStyle(this.canvasStatic);
    this.canvasStatic.classList.add("show_paint");

    this.rootBlock.append(this.canvasStatic);
    this.rootBlock.appendChild(this.canvas);
  }
}

function getCnavasElement(c?: string | HTMLElement): HTMLCanvasElement {
  if (c instanceof HTMLCanvasElement) {
    return c;
  } else if (typeof c === "string") {
    const el = document.getElementById(c);
    if (el && el instanceof HTMLCanvasElement) {
      return el;
    }
  }
  return document.createElement("canvas");
}

function checkCanvasContext(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d");
  if (ctx) {
    return ctx;
  } else {
    throw new Error("無法獲取 getContext");
  }
}
