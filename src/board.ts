import {
  ToolsManagement,
  UtilTools,
  defaultZoom,
  BaseShape,
  ImageShape,
  PDFShape,
  SelectSolidRect,
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
  get devicePixelRatio() {
    return window.devicePixelRatio;
  }
  /** 所有被繪製的圖形 */
  private __shapes: BoardShapeLog = new Map<string, BaseShape>();
  get shapes(): BoardShapeLog {
    return this.__socket?.shapes || this.__shapes;
  }

  private __toolsShapes: BoardShapeLog = new Map<string, BaseShape>();
  get toolsShapes(): BoardShapeLog {
    return this.__socket?.toolsShapes || this.__toolsShapes;
  }

  /** 工具包中間件 */
  private __tools: ToolsManagement;
  /**
   * @deprecated 與 socket 上的local manager同名
   */
  get toolsCtrl() {
    return this.__tools;
  }
  get localManager() {
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

  private cancelLoopId: number;
  get size(): [number, number] {
    const { width, height } = this.__canvasStatic;
    return [width, height];
  }

  refZoomMatrix = new DOMMatrix();

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
    this.zoom = defaultZoom; // pageZoom, default { x: 0, y: 0, k: 1 }
    const { Socket, Tools = ToolsManagement } = Object.assign({}, config);
    this.__socket = Socket || null;
    this.__tools = new Tools(this);
    this.onEventStart = this.onEventStart.bind(this);
    this.onEventMove = this.onEventMove.bind(this);
    this.onEventEnd = this.onEventEnd.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);

    this.initial();
    this.cancelLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  loopClear() {
    const [width, height] = this.size;
    this.ctx.clearRect(0, 0, width, height);
    this.ctxStatic.clearRect(0, 0, width, height);
  }

  loop(t: number) {
    this.loopClear();
    this.refZoomMatrix = UtilTools.getZoomMatrix(this.zoom);
    this.shapes.forEach((bs) => {
      bs.updata(t);
    });
    this.toolsShapes.forEach((bs) => {
      bs.updata(t);
    });

    this.cancelLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  /** 工具用圖形 */
  addToolsShape(bs: BaseShape) {
    this.toolsShapes.set(bs.id, bs);
  }

  removeToolsShape(bs: BaseShape) {
    this.toolsShapes.delete(bs.id);
  }

  addShape(p: Path2D, s: Styles, m: Rect) {
    const id = UtilTools.RandomID(Array.from(this.shapes.keys())),
      bs = new BaseShape(id, this, p, s, m);
    this.addShapeByBs(bs);
  }

  addShapeByBs(bs: BaseShape) {
    this.shapes.set(bs.id, bs);
  }

  deleteShape(shapes: BaseShape[]) {
    const id: string[] = [];
    shapes.forEach((bs) => {
      id.push(bs.id);
      bs.isDelete = true;
    });
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
    if ((bs instanceof ImageShape || bs instanceof PDFShape) && bs.isLoad) {
      const { x, y } = bs.coveredRect.nw;
      const [width, height] = bs.coveredRect.size;
      useCtx.setTransform(
        DOMMatrix.fromMatrix(bs.finallyMatrix).preMultiplySelf(
          this.refZoomMatrix
        )
      );
      useCtx.drawImage(bs.htmlEl, x, y, width, height);
    } else if (bs instanceof SelectSolidRect) {
      const p = new Path2D();
      p.addPath(bs.pathWithMatrix, this.refZoomMatrix);
      useCtx.stroke(p);
    } else {
      useCtx.setTransform(this.refZoomMatrix);
      if (bs.style.fillColor) {
        useCtx.fill(bs.pathWithMatrix);
      } else {
        useCtx.stroke(bs.pathWithMatrix);
      }
    }
    useCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  renderPathToEvent(p: Path2D, s: Styles, m?: DOMMatrix) {
    this.ctx.setTransform(
      DOMMatrix.fromMatrix(this.refZoomMatrix).preMultiplySelf(m)
    );
    UtilTools.injectStyle(this.ctx, s);
    if (s.fillColor) {
      this.ctx.fill(p);
    } else {
      this.ctx.stroke(p);
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** 取得圖形物件 */
  getShapeById(id: string): BaseShape | undefined {
    return this.shapes.get(id);
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
    this.canvas.addEventListener("mousedown", this.onEventStart);
    this.canvas.addEventListener("touchstart", this.onEventStart);

    this.canvas.addEventListener("mousemove", this.onEventMove);
    this.canvas.addEventListener("touchmove", this.onEventMove);

    this.canvas.addEventListener("mouseup", this.onEventEnd);
    this.canvas.addEventListener("mouseleave", this.onEventEnd);
    this.canvas.addEventListener("touchend", this.onEventEnd);
    this.canvas.addEventListener("touchcancel", this.onEventEnd);

    window.addEventListener("resize", this.resizeCanvas);
  }

  private removeListener() {
    this.canvas.removeEventListener("mousedown", this.onEventStart);
    this.canvas.removeEventListener("touchstart", this.onEventStart);

    this.canvas.removeEventListener("mousemove", this.onEventMove);
    this.canvas.removeEventListener("touchmove", this.onEventMove);

    this.canvas.removeEventListener("mouseup", this.onEventEnd);
    this.canvas.removeEventListener("mouseleave", this.onEventEnd);
    this.canvas.removeEventListener("touchend", this.onEventEnd);
    this.canvas.removeEventListener("touchcancel", this.onEventEnd);

    window.removeEventListener("resize", this.resizeCanvas);
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
