import { Board, BaseShape, BoardShapeLog, UtilTools } from "..";
import type { Vec2, Zoom } from "..";

type ActiveFlag = true | false;

/**
 * 控制插件
 */
export class PreviewMask {
  private __rootBlock!: HTMLDivElement;
  get rootBlock(): HTMLDivElement {
    return this.__rootBlock;
  }
  private __canvas: HTMLCanvasElement;
  get canvas(): HTMLCanvasElement {
    return this.__canvas;
  }
  private __ctx: CanvasRenderingContext2D;
  get ctx(): CanvasRenderingContext2D {
    return this.__ctx;
  }
  isOpen: ActiveFlag = false;
  private activeFlag: ActiveFlag;
  /** 板子實例 */
  private board: Board;
  private prevPreviewZoom!: Zoom;
  /** 像素密度 */
  readonly devicePixelRatio!: number;
  /** 所有被繪製的圖形 */
  private __shapes: BoardShapeLog = new Map<string, BaseShape>();
  get shapes(): BoardShapeLog {
    return this.__shapes;
  }

  startPosition: Vec2 = { x: 0, y: 0 };

  get size(): [number, number] {
    const { width, height } = this.__canvas;
    return [width, height];
  }

  constructor(canvas: HTMLCanvasElement | string, board: Board) {
    this.__canvas = UtilTools.getCnavasElement(canvas);
    this.__ctx = UtilTools.checkCanvasContext(this.__canvas);
    this.devicePixelRatio = window.devicePixelRatio;
    this.board = board;
    this.activeFlag = false;
    this.onEventStart = this.onEventStart.bind(this);
    this.onEventMove = this.onEventMove.bind(this);
    this.onEventEnd = this.onEventEnd.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.disableWindowWheel = this.disableWindowWheel.bind(this);
    this.changeZoomLevel = this.changeZoomLevel.bind(this);

    this.initial();
  }

  private initial() {
    this.settingChild();
    this.addListener();
  }

  open() {
    this.isOpen = true;
    this.addWheelListener();
  }

  close() {
    this.isOpen = false;
    this.removeWheelListener();
  }

  toggle() {
    if (this.board.previewCtrl.isOpen) this.close();
    else this.open();
  }

  destroy() {
    this.removeListener();
  }

  // same as Board.addListener
  private addListener() {
    this.canvas.addEventListener("mousedown", this.onEventStart);
    this.canvas.addEventListener("touchstart", this.onEventStart);

    this.canvas.addEventListener("mousemove", this.onEventMove);
    this.canvas.addEventListener("touchmove", this.onEventMove);

    this.canvas.addEventListener("mouseup", this.onEventEnd);
    this.canvas.addEventListener("mouseleave", this.onEventEnd);
    this.canvas.addEventListener("touchend", this.onEventEnd);
    this.canvas.addEventListener("touchcancel", this.onEventEnd);

    this.addWheelListener();
  }

  private addWheelListener() {
    window.addEventListener("wheel", this.changeZoomLevel);
    window.addEventListener("wheel", this.disableWindowWheel, {
      passive: false,
    });
    window.addEventListener("resize", this.resizeCanvas);
  }

  // same as Board.removeListener
  private removeListener() {
    this.canvas.removeEventListener("mousedown", this.onEventStart);
    this.canvas.removeEventListener("touchstart", this.onEventStart);

    this.canvas.removeEventListener("mousemove", this.onEventMove);
    this.canvas.removeEventListener("touchmove", this.onEventMove);

    this.canvas.removeEventListener("mouseup", this.onEventEnd);
    this.canvas.removeEventListener("mouseleave", this.onEventEnd);
    this.canvas.removeEventListener("touchend", this.onEventEnd);
    this.canvas.removeEventListener("touchcancel", this.onEventEnd);

    this.removeWheelListener();
  }

  private removeWheelListener() {
    window.removeEventListener("wheel", this.changeZoomLevel);
    window.removeEventListener("wheel", this.disableWindowWheel);
    window.removeEventListener("resize", this.resizeCanvas);
  }

  private disableWindowWheel(e: Event) {
    if (!this.activeFlag) {
      e.preventDefault();
    }
  }

  /** 觸摸/滑鼠下壓 */
  private onEventStart(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    this.activeFlag = true;
    this.startPosition = position;
    this.prevPreviewZoom = this.board.zoom;
  }
  private onEventMove(event: TouchEvent | MouseEvent) {
    const position = this.eventToPosition(event);
    if (this.activeFlag) {
      this.board.previewCtrl.hideWindow();
      this.updatePageZoom(position);
    } else {
      this.startPosition = position;
    }
  }

  /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
  private onEventEnd(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    if (this.activeFlag) {
      this.activeFlag = false;
    }
  }

  // same as Board.eventToPosition
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
    this.setCanvasStyle(this.canvas);
  }

  private setCanvasStyle(el: HTMLCanvasElement) {
    const clientWidth = window.innerWidth;
    const clientHeight = window.innerHeight;
    el.setAttribute("width", `${clientWidth * this.devicePixelRatio}px`);
    el.setAttribute("height", `${clientHeight * this.devicePixelRatio}px`);
    el.style.width = `${clientWidth}px`;
    el.style.height = `${clientHeight}px`;
    el.style.opacity = "0.4";
    el.style.backgroundColor = "#000";
  }
  /** 調整使用者給予的 Canvas */
  private settingChild() {
    this.canvas.after(this.rootBlock);
    this.setCanvasStyle(this.canvas);
    this.canvas.classList.add("event_paint");
    this.canvas.style.display = "none";
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
  }

  getNextPreviewZoom({ x, y }: Vec2) {
    const { prevPreviewZoom } = this;
    return {
      x: prevPreviewZoom.x + x / prevPreviewZoom.k,
      y: prevPreviewZoom.y + y / prevPreviewZoom.k,
      k: prevPreviewZoom.k,
    };
  }

  updatePageZoom(position: Vec2) {
    const { k } = this.board.zoom;
    const x = -(position.x - this.startPosition.x) / 1;
    const y = -(position.y - this.startPosition.y) / 1;
    const nextPreviewZoom = this.getNextPreviewZoom({ x, y });
    const { x: nx, y: ny } = nextPreviewZoom;

    this.board.updateZoom({
      x: nx,
      y: ny,
      k,
    });
  }

  changeZoomLevel(e: WheelEvent) {
    const { zoom: currentPageZoom } = this.board;
    const { width, height } = this.ctx.canvas;
    const { deltaX, deltaY } = e;
    const delta =
      (Math.sqrt(deltaX * deltaX + deltaY * deltaY) * (deltaY ? deltaY : 1)) /
      Math.abs(deltaY ? deltaY : 1);
    const currentPos = this.eventToPosition(e);
    const ratio = (delta + height) / height;
    const k =
      currentPageZoom.k * ratio > 3
        ? 3
        : currentPageZoom.k * ratio < 0.3
        ? 0.3
        : currentPageZoom.k * ratio;
    const x =
      currentPageZoom.x - currentPos.x * 1 * (-1 / currentPageZoom.k + 1 / k);
    const y =
      currentPageZoom.y - currentPos.y * 1 * (-1 / currentPageZoom.k + 1 / k);

    this.board.updateZoom({
      x,
      y,
      k,
    });
  }
}
