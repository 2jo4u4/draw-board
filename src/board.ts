import {
  ToolsManagement,
  UtilTools,
  defaultZoom,
  BaseShape,
  ImageShape,
  PDFShape,
} from ".";
import type { SendData, SocketMiddle, Rect, Styles, Vec2, Zoom } from ".";
import { PreviewWindow } from "./preview";
import { pencil, earser } from "./assets";

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
  private __previewCanvas!: HTMLCanvasElement;
  get preview(): HTMLCanvasElement {
    return this.__previewCanvas;
  }
  /** 滑鼠旗標（是否點擊） */
  private mouseFlag: MouseFlag = "inactive";
  zoom: Zoom;
  /** 像素密度 */
  readonly devicePixelRatio!: number;
  /** 所有被繪製的圖形 */
  private __shapes: BoardShapeLog = new Map<string, BaseShape>();
  get shapes(): BoardShapeLog {
    return this.__socket?.getShapes || this.__shapes;
  }

  private __toolsShape: BoardShapeLog = new Map<string, BaseShape>();
  get toolsShape(): BoardShapeLog {
    return this.__socket?.getToolsShapes || this.__toolsShape;
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
  private __preview!: PreviewWindow;
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
    if (!this.__canEdit) {
      this.toolsCtrl.switchTypeToViewer();
    }
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
    this.__canvas = UtilTools.getCnavasElement(canvas);
    this.__ctx = UtilTools.checkCanvasContext(this.__canvas);
    this.setStaticCanvas();
    this.devicePixelRatio = window.devicePixelRatio;
    this.zoom = defaultZoom; // pageZoom, default { x: 0, y: 0, k: 1 }
    this.initial();
    const { Socket, Tools = ToolsManagement } = Object.assign({}, config);
    this.__socket = Socket || null;
    this.__tools = new Tools(this);

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
    this.toolsShape.forEach((bs) => {
      bs.updata(t);
    });

    this.cancelLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  /** 變更Page */
  changePage(shapes: BoardShapeLog) {
    this.__shapes = shapes;
  }

  /** 工具用圖形 */
  addToolsShape(bs: BaseShape) {
    this.toolsShape.set(bs.id, bs);
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
    this.logAction("draw", bs.id);
  }

  /** 刪除已選圖形 */
  deleteShape(shapes: BaseShape[]) {
    const id: string[] = [];
    shapes.forEach((bs) => {
      if (bs.canSelect && (bs.isSelect || bs.willDelete)) {
        id.push(bs.id);
        bs.isDelete = true;
      }
    });
    this.logAction("delete", ...id);
  }

  renderBaseShape(bs: BaseShape) {
    let ctx: CanvasRenderingContext2D;
    if (bs.isSelect || bs.willDelete) {
      ctx = this.ctx;
    } else {
      ctx = this.ctxStatic;
    }
    this.render(ctx, bs);
  }

  render(useCtx: CanvasRenderingContext2D, bs: BaseShape) {
    UtilTools.injectStyle(useCtx, bs.style);
    const zoomMatrix = UtilTools.translate(
      { x: this.zoom.x, y: this.zoom.y },
      { x: 0, y: 0 }
    ).scale(this.zoom.k, this.zoom.k, 1, this.zoom.x, this.zoom.y);
    if ((bs instanceof ImageShape || bs instanceof PDFShape) && bs.isLoad) {
      const { x, y } = bs.coveredRect.nw;
      const [width, height] = bs.coveredRect.size;
      useCtx.setTransform(bs.matrix);
      useCtx.drawImage(bs.htmlEl, x, y, width, height);
    } else {
      useCtx.setTransform(DOMMatrix.fromMatrix(zoomMatrix));
      if (bs.style.fillColor) {
        useCtx.fill(bs.pathWithMatrix);
      } else {
        useCtx.stroke(bs.pathWithMatrix);
      }
    }
    useCtx.setTransform(1, 0, 0, 1, 0, 0);
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
    return (
      this.ctx.isPointInPath(p, v.x, v.y) ||
      this.ctx.isPointInStroke(p, v.x, v.y)
    );
  }

  /** 上一步 */
  undo() {}
  /** 下一步 */
  redo() {}

  /** 統一與socket middleware溝通 */
  sendEvent(p: SendData) {
    // console.log("sendEvent", UserAction[p.type], p);
    this.socketCtrl?.postData(p);
  }

  initialPreview(canvas: HTMLCanvasElement, options: { className?: string }) {
    this.__previewCanvas = canvas;
    this.__preview = new PreviewWindow(canvas, this, options);
  }

  /** 初始化 canvas */
  private initial() {
    this.settingChild();
    this.addListener();
  }

  destroy() {
    this.removeListener();
    cancelAnimationFrame(this.cancelLoopId);
  }

  private setStaticCanvas() {
    this.__canvasStatic = UtilTools.getCnavasElement();
    this.__ctxStatic = UtilTools.checkCanvasContext(this.canvasStatic);
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
    // 設定大小
    this.setCanvasStyle(this.canvas);
    this.setCanvasStyle(this.canvasStatic);
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

  updateZoom(zoom: Zoom) {
    this.zoom = zoom;
  }
}
