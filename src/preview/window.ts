import { Board, BaseShape, BoardShapeLog, BaseTools, UtilTools } from "..";
import { PreviewTools } from "./previewTool";

interface Zoom {
  x: number;
  y: number;
  k: number;
}
/**
 * 控制插件
 */
export class PreviewWindow {
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
  private __canvasStatic!: HTMLCanvasElement;
  get canvasStatic(): HTMLCanvasElement {
    return this.__canvasStatic;
  }
  private __ctxStatic!: CanvasRenderingContext2D;
  get ctxStatic(): CanvasRenderingContext2D {
    return this.__ctxStatic;
  }
  /** 板子實例 */
  private board: Board;
  private zoom: Zoom;
  private windowRatio: number;
  /** 儲存當前選擇的工具 */
  private previewTools: PreviewTools;
  /** 像素密度 */
  readonly decivePixelPatio!: number;
  /** 所有被繪製的圖形 */
  private __shapes: BoardShapeLog = new Map<string, BaseShape>();
  get shapes(): BoardShapeLog {
    return this.__shapes;
  }
  constructor(canvas: HTMLCanvasElement | string, board: Board) {
    this.__canvas = UtilTools.getCnavasElement(canvas);
    this.__ctx = UtilTools.checkCanvasContext(this.__canvas);
    this.setStaticCanvas();
    this.board = board;
    this.__shapes = board.shapes;
    this.decivePixelPatio = window.devicePixelRatio;
    this.zoom = { x: 0, y: 0, k: 1 };
    this.windowRatio = 1 / 3;
    this.previewTools = new PreviewTools(board);

    this.initial();
    this.addListener();
  }

  clearCanvas(type?: "static" | "event") {
    const { width, height } = this.canvasStatic;
    type !== "static" && this.ctx.clearRect(0, 0, width, height);
    type !== "event" && this.ctxStatic.clearRect(0, 0, width, height);
  }
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
  rerender() {
    this.clearCanvas();
    this.shapes.forEach((bs) => {
      if (bs.isSelect) {
        this.rerenderToEvent({ bs });
      } else {
        this.rerenderToPaint({ bs });
      }
    });
  }

  private initial() {
    this.settingChild();
  }

  destroy() {
    this.removeListener();
  }
  private setStaticCanvas() {
    this.__canvasStatic = UtilTools.getCnavasElement();
    this.__ctxStatic = UtilTools.checkCanvasContext(this.canvasStatic);
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

    window.removeEventListener("resize", this.resizeCanvas.bind(this));
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
        ((x - left) / (this.canvas.width / this.decivePixelPatio / width)) *
        this.decivePixelPatio,
      y:
        ((y - top) / (this.canvas.height / this.decivePixelPatio / height)) *
        this.decivePixelPatio,
    };

    return back;
  }

  /** 觸摸/滑鼠下壓 */
  private onEventStart(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    this.previewTools.onEventStart(position);
  }
  private onEventMove(event: TouchEvent | MouseEvent) {
    const position = this.eventToPosition(event);
    // TODO move viewport or wheel
    this.onEventMoveActive(position);
    // this.onEventMoveInActive(position);
  }
  /** 手指/滑鼠 移動過程(下壓時的移動過程) */
  private onEventMoveActive(v: Vec2): void {
    this.previewTools.onEventMoveActive(v);
  }
  /** 手指/滑鼠 移動過程(非下壓時的移動過程) */
  private onEventMoveInActive(v: Vec2): void {
    this.previewTools.onEventMoveInActive(v);
  }
  /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
  private onEventEnd(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    this.previewTools.onEventEnd(position);
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
    const clientWidth = window.innerWidth * this.windowRatio;
    const clientHeight = window.innerHeight * this.windowRatio;
    el.setAttribute("width", `${clientWidth * this.decivePixelPatio}px`);
    el.setAttribute("height", `${clientHeight * this.decivePixelPatio}px`);
    el.style.width = `${clientWidth}px`;
    el.style.height = `${clientHeight}px`;
  }
  /** 調整使用者給予的 Canvas */
  private settingChild() {
    this.__rootBlock = document.createElement("div");
    this.rootBlock.style.position = "relative";
    this.rootBlock.classList.add("previewRoot");
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
