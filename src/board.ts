import { BaseShape, Rect, SocketMiddle, ToolsManagement, UtilTools } from ".";
import { PreviewWindow } from "./preview";
import { pencil, earser } from "./assets";
import { ImageShape } from "./shape/image";

type MouseFlag = "active" | "inactive"; // 滑鼠左鍵 活躍 / 非活躍
type Action = "draw" | "delete" | "translate" | "rotate" | "scale" | "putImage"; // 可被紀錄的行為
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
  /** Preview Canvas網頁元素 */
  private __previewCanvas: HTMLCanvasElement;
  get preview(): HTMLCanvasElement {
    return this.__previewCanvas;
  }

  /** 滑鼠旗標（是否點擊） */
  private mouseFlag: MouseFlag = "inactive";
  /** 像素密度 */
  readonly devicePixelRatio!: number;
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
  /** Preview中間件 */
  private __preview: PreviewWindow;
  get previewCtrl() {
    return this.__preview;
  }
  /** 網路請求中間件 */
  private __socket: SocketMiddle | null = null;
  get socketCtrl() {
    return this.__socket;
  }

  private __canEdit = true;
  get canEdit() {
    return this.__canEdit;
  }
  set canEdit(b: boolean) {
    this.__canEdit = b;
  }

  private cancelLoopId: number;

  get size(): [number, number] {
    const { width, height } = this.__canvasStatic;
    return [width, height];
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

    const {
      preview,
      canvas: previewCanvas,
      tools: previewTools,
    } = this.initialPreview();
    this.__previewCanvas = previewCanvas;
    this.__preview = new PreviewWindow(previewCanvas, this);
    this.__socket = Socket || null;
    this.devicePixelRatio = window.devicePixelRatio;

    this.initial();
    this.addListener();

    this.cancelLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  loopClear() {
    const [width, height] = this.size;
    this.ctx.clearRect(0, 0, width, height);
    this.ctxStatic.clearRect(0, 0, width, height);
  }

  loop(t: number) {
    this.loopClear();
    this.shapes.forEach((bs) => {
      bs.updata(t);
    });

    this.cancelLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  /** 清除指定畫布(若無指定則清除兩畫布) */
  clearCanvas(type?: "static" | "event") {
    const [width, height] = this.size;
    type !== "static" && this.ctx.clearRect(0, 0, width, height);
    type !== "event" && this.ctxStatic.clearRect(0, 0, width, height);
  }

  absoluteDelete(id: string) {
    this.shapes.delete(id);
  }

  /** 取得圖形物件 */
  getShapeById(id: string): BaseShape | undefined {
    return this.shapes.get(id);
  }
  /** 添加圖形到圖層級 & 紀錄 */
  addShape(p: Path2D, s: Styles, m: Rect) {
    const id = UtilTools.RandomID(Array.from(this.shapes.keys())),
      bs = new BaseShape(id, this, p, s, m);
    this.addShapeByBs(bs);
  }

  /** 添加圖形到圖層級 & 紀錄 */
  addShapeByBs(bs: BaseShape) {
    this.shapes.set(bs.id, bs);
    // this.previewCtrl.rerender();
    this.logAction("draw", bs.id);
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
  /**
   * 重新繪製事件層
   *
   * @deprecated
   */
  rerenderToEvent(v: {
    needClear?: boolean;
    bs?: { p: Path2D; s: Styles } | BaseShape;
  }) {
    this.rerenderTo(this.ctx, { type: "event", ...v });
  }
  /**
   * 重新繪製圖層
   *
   * @deprecated
   */
  rerenderToPaint(v: {
    needClear?: boolean;
    bs?: { p: Path2D; s: Styles } | BaseShape;
  }) {
    this.rerenderTo(this.ctxStatic, { type: "static", ...v });
  }

  /**
   * @deprecated
   */
  rerenderTo(
    useCtx: CanvasRenderingContext2D,
    v: {
      needClear?: boolean;
      type: "event" | "static";
      bs?: { p: Path2D; s: Styles } | BaseShape;
    }
  ) {
    const { needClear, bs, type } = v;
    if (bs) {
      Boolean(needClear) && this.clearCanvas(type);
      if (bs instanceof BaseShape) {
        if (bs instanceof ImageShape && bs.isLoad) {
          this.rerenderToWithFileShape(useCtx, bs);
        } else {
          useCtx.setTransform(bs.matrix);
          UtilTools.injectStyle(useCtx, bs.style);
          if (bs.style.fillColor) {
            useCtx.fill(bs.path);
          } else {
            useCtx.stroke(bs.path);
          }
          useCtx.setTransform(1, 0, 0, 1, 0, 0);
        }
      } else {
        UtilTools.injectStyle(useCtx, bs.s);
        if (bs.s.fillColor) {
          useCtx.fill(bs.p);
        } else {
          useCtx.stroke(bs.p);
        }
      }
    } else {
      this.clearCanvas(type);
      const isSelect = type === "event";
      this.shapes.forEach((_bs) => {
        if (!_bs.isDelete && _bs.isSelect === isSelect) {
          if (_bs instanceof ImageShape && _bs.isLoad) {
            this.rerenderToWithFileShape(useCtx, _bs);
          } else {
            UtilTools.injectStyle(useCtx, _bs.style);
            if (_bs.style.fillColor) {
              useCtx.fill(_bs.path);
            } else {
              useCtx.stroke(_bs.path);
            }
          }
        }
      });
    }
  }

  renderBaseShape(bs: BaseShape) {
    let ctx: CanvasRenderingContext2D;
    if (bs.isSelect) {
      ctx = this.ctx;
    } else {
      ctx = this.ctxStatic;
    }
    this.render(ctx, bs);
  }

  render(useCtx: CanvasRenderingContext2D, bs: BaseShape) {
    UtilTools.injectStyle(useCtx, bs.style);
    if (bs instanceof ImageShape && bs.isLoad) {
      const { x, y } = bs.coveredRect.nw;
      const [width, height] = bs.coveredRect.size;
      useCtx.setTransform(bs.matrix);
      useCtx.drawImage(bs.image, x, y, width, height);
      useCtx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      if (bs.style.fillColor) {
        useCtx.fill(bs.pathWithMatrix);
      } else {
        useCtx.stroke(bs.pathWithMatrix);
      }
    }
  }

  renderPathToEvent(p: Path2D, s: Styles, m?: DOMMatrix) {
    this.ctx.setTransform(DOMMatrix.fromMatrix(m));
    UtilTools.injectStyle(this.ctx, s);
    if (s.fillColor) {
      this.ctx.fill(p);
    } else {
      this.ctx.stroke(p);
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  rerenderToPaintWithFileShape(bs: ImageShape) {
    this.rerenderToWithFileShape(this.ctxStatic, bs);
  }

  rerenderToEventWithFileShape(bs: ImageShape) {
    this.rerenderToWithFileShape(this.ctx, bs);
  }

  rerenderToWithFileShape(useCtx: CanvasRenderingContext2D, bs: ImageShape) {
    const { x, y } = bs.coveredRect.nw;
    const [width, height] = bs.coveredRect.size;
    useCtx.setTransform(bs.matrix);
    useCtx.drawImage(bs.image, x, y, width, height);
    useCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  /** 重新繪製所有層 */
  rerender() {
    this.shapes.forEach((bs) => {
      if (!bs.isDelete) {
        if (bs.isSelect) {
          this.rerenderToEvent({ bs });
        } else {
          this.rerenderToPaint({ bs });
        }
      }
    });
    // this.previewCtrl.rerender();
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
  /** 變更鼠標樣式 */
  changeCursor(
    type:
      | "move"
      | "default"
      | "nw-resize"
      | "ne-resize"
      | "sw-resize"
      | "se-resize"
      | "grab"
      | "grabbing"
      | "earser"
      | "pencil"
  ) {
    if (type === "earser") {
      this.canvas.style.cursor = earser;
    } else if (type === "pencil") {
      this.canvas.style.cursor = pencil;
    } else {
      this.canvas.style.cursor = type;
    }
  }

  /** 確認路徑是否包含座標 */
  checkPointInPath(p: Path2D, v: Vec2): boolean {
    return this.ctx.isPointInPath(p, v.x, v.y);
  }

  /** 上一步 */
  undo() {}
  /** 下一步 */
  redo() {}

  private initialPreview() {
    const preview = document.createElement("div");
    const canvas = document.createElement("canvas");
    const tools = document.createElement("ul");

    document.body.append(preview, canvas, tools);

    // const previewWindow = new PreviewWindow(canvas, board);
    return { preview, canvas, tools };
  }

  /** 初始化 canvas */
  private initial() {
    this.settingChild();
  }

  destroy() {
    this.removeListener();
    cancelAnimationFrame(this.cancelLoopId);
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
        ((x - left) / (this.canvas.width / this.devicePixelRatio / width)) *
        this.devicePixelRatio,
      y:
        ((y - top) / (this.canvas.height / this.devicePixelRatio / height)) *
        this.devicePixelRatio,
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
    el.setAttribute("width", `${clientWidth * this.devicePixelRatio}px`);
    el.setAttribute("height", `${clientHeight * this.devicePixelRatio}px`);
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
