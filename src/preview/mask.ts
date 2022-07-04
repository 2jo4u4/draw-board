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
  private zoom: Zoom; // previewZoom
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
    this.initial();
    this.activeFlag = false;
    this.zoom = board.previewCtrl.getPreviewZoom(board.zoom, 1);

    this.addListener();
  }

  private initial() {
    this.settingChild();
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  destroy() {
    this.removeListener();
  }

  // same as Board.addListener
  private addListener() {
    this.canvas.addEventListener("mousedown", this.onEventStart.bind(this));
    this.canvas.addEventListener("touchstart", this.onEventStart.bind(this));

    this.canvas.addEventListener("mousemove", this.onEventMove.bind(this));
    this.canvas.addEventListener("touchmove", this.onEventMove.bind(this));

    this.canvas.addEventListener("mouseup", this.onEventEnd.bind(this));
    this.canvas.addEventListener("mouseleave", this.onEventEnd.bind(this));
    this.canvas.addEventListener("touchend", this.onEventEnd.bind(this));
    this.canvas.addEventListener("touchcancel", this.onEventEnd.bind(this));

    this.canvas.addEventListener("wheel", this.changeZoomLevel.bind(this));

    window.addEventListener("wheel", this.disableWindowWheel.bind(this), {
      passive: false,
    });
    window.addEventListener("resize", this.resizeCanvas.bind(this));
  }

  // same as Board.removeListener
  private removeListener() {
    this.canvas.removeEventListener("mousedown", this.onEventStart.bind(this));
    this.canvas.removeEventListener("touchstart", this.onEventStart.bind(this));

    this.canvas.removeEventListener("mousemove", this.onEventMove.bind(this));
    this.canvas.removeEventListener("touchmove", this.onEventMove.bind(this));

    this.canvas.removeEventListener("mouseup", this.onEventEnd.bind(this));
    this.canvas.removeEventListener("mouseleave", this.onEventEnd.bind(this));
    this.canvas.removeEventListener("touchend", this.onEventEnd.bind(this));
    this.canvas.removeEventListener("touchcancel", this.onEventEnd.bind(this));

    this.canvas.removeEventListener("wheel", this.changeZoomLevel.bind(this));
    window.removeEventListener("wheel", this.disableWindowWheel.bind(this));
    window.removeEventListener("resize", this.resizeCanvas.bind(this));
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
    this.zoom = this.board.previewCtrl.getPreviewZoom(this.board.zoom, 1);
    this.startPosition = position;
  }
  private onEventMove(event: TouchEvent | MouseEvent) {
    const position = this.eventToPosition(event);
    // TODO move viewport or wheel
    if (this.activeFlag) {
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
    this.prevPreviewZoom = this.zoom;
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
      x: this.zoom.x + x / prevPreviewZoom.k,
      y: this.zoom.y + y / prevPreviewZoom.k,
      k: this.zoom.k,
    };
  }
  getPreviousPreviewZoom(width: number, height: number): Zoom {
    const {
      zoom: { k },
      prevPreviewZoom,
    } = this;
    return {
      x: prevPreviewZoom.x + width * (1 / prevPreviewZoom.k - 1 / k),
      y: prevPreviewZoom.y + height * (1 / prevPreviewZoom.k - 1 / k),
      k,
    };
  }
  updatePageZoom(position: Vec2, isMaskZoomLimited = false) {
    const { width, height } = this.ctx.canvas;
    const { k } = this.board.zoom;
    const x = -(position.x - this.startPosition.x) / k;
    const y = -(position.y - this.startPosition.y) / k;
    const nextPreviewZoom = this.getNextPreviewZoom({ x, y });
    const previousPreviewZoom = this.getPreviousPreviewZoom(width, height);
    const { prevPreviewZoom } = this;
    const { x: nx, y: ny } = nextPreviewZoom;
    const { x: px, y: py } = previousPreviewZoom;
    if (isMaskZoomLimited) {
      if (
        (nx < prevPreviewZoom.x || nx > px) &&
        (ny < prevPreviewZoom.y || ny > py)
      )
        return;

      this.board.updateZoom({
        x: nx < prevPreviewZoom.x ? prevPreviewZoom.x : nx > px ? px : nx,
        y: ny < prevPreviewZoom.y ? prevPreviewZoom.y : ny > py ? py : ny,
        k,
      });
    } else {
      this.board.updateZoom({
        x: nx,
        y: ny,
        k,
      });
    }
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
