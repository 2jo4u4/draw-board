import {
  Board,
  BaseShape,
  BoardShapeLog,
  BaseTools,
  defaultTransform,
  UtilTools,
} from "..";
import { PreviewTools } from "./previewTool";

type ActiveFlag = true | false;

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
  private activeFlag: ActiveFlag;
  /** 板子實例 */
  private board: Board;
  private zoom: Zoom; // previewZoom
  readonly windowRatio: number;
  get previewRatio() {
    return `${this.zoom.k * 100}`;
  }
  /** 儲存當前選擇的工具 */
  private __tools: PreviewTools;
  get toolsCtrl() {
    return this.__tools;
  }
  /** 像素密度 */
  readonly devicePixelRatio!: number;
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
    this.windowRatio = 1 / 3;
    this.__tools = new PreviewTools(board, this.windowRatio);
    this.activeFlag = false;
    this.devicePixelRatio = window.devicePixelRatio;
    this.zoom = this.getPreviewZoom(board.zoom, this.windowRatio);

    console.log("Window", board.zoom, this.zoom);
    this.initial();
  }

  clearCanvas(type?: "static" | "event") {
    console.log("preview clearCanvas");
    const { width, height } = this.canvasStatic;
    type !== "static" && this.ctx.clearRect(0, 0, width, height);
    type !== "event" && this.ctxStatic.clearRect(0, 0, width, height);
  }
  rerenderToEvent(v: {
    needClear?: boolean;
    bs?: { p: Path2D; s: Styles } | BaseShape;
  }) {
    const { needClear, bs } = v;
    console.log("rerenderToEvent", bs, UtilTools.isBaseShape(bs));
    Boolean(needClear) && this.clearCanvas("event");
    if (bs) {
      console.log(this.board.zoom);
      const path = new Path2D(),
        m = new DOMMatrix(),
        scaleX = this.board.zoom.k / this.windowRatio,
        scaleY = this.board.zoom.k / this.windowRatio,
        originX = this.board.zoom.x,
        originY = this.board.zoom.y;
      if (UtilTools.isBaseShape(bs)) {
        const path = UtilTools.getZoomedPreviewPath(
          bs.path,
          this.board.zoom,
          this.zoom
        );
        UtilTools.injectStyle(this.ctx, bs.style);
        if (bs.style.fillColor) {
          this.ctx.fill(path);
        } else {
          this.ctx.stroke(path);
        }
        this.ctx.stroke(path);
      } else {
        const path = UtilTools.getZoomedPreviewPath(
          bs.p,
          this.board.zoom,
          this.zoom
        );
        UtilTools.injectStyle(this.ctx, bs.s);
        if (bs.s.fillColor) {
          this.ctx.fill(path);
        } else {
          this.ctx.stroke(path);
        }
      }
    } else {
      this.shapes.forEach((_bs) => {
        if (!_bs.isDelete && _bs.isSelect) {
          const path = UtilTools.getZoomedPreviewPath(
            _bs.path,
            this.board.zoom,
            this.zoom
          );
          UtilTools.injectStyle(this.ctx, _bs.style);
          this.ctx.stroke(path);
        }
      });
    }
  }
  /** 重新繪製圖層 */
  rerenderToPaint(v: { needClear?: boolean; bs?: BaseShape }) {
    const { needClear, bs } = v;
    Boolean(needClear) && this.clearCanvas("static");
    if (bs) {
      const path = UtilTools.getZoomedPreviewPath(
        bs.path,
        this.board.zoom,
        this.zoom
      );
      UtilTools.injectStyle(this.ctxStatic, bs.style);
      if (bs.style.fillColor) {
        this.ctxStatic.fill(path);
      } else {
        this.ctxStatic.stroke(path);
      }
    } else {
      console.log("=== rerenderToPaint not BS ===");
      this.shapes.forEach((_bs) => {
        if (!_bs.isDelete && !_bs.isSelect) {
          const path = UtilTools.getZoomedPreviewPath(
            _bs.path,
            this.board.zoom,
            this.zoom
          );
          UtilTools.injectStyle(this.ctxStatic, _bs.style);
          this.ctxStatic.stroke(path);
        }
      });
    }
  }
  rerender() {
    this.clearCanvas();
    this.shapes.forEach((bs) => {
      console.log(bs);
      this.rerenderToPaint({ bs });
    });
    this.toolsCtrl.renderViewport();
  }

  private initial() {
    this.settingChild();
    this.addListener();
    this.toolsCtrl.initial();
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

  /** 觸摸/滑鼠下壓 */
  private onEventStart(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    console.log("onEventStart", position);
    this.activeFlag = true;
    this.toolsCtrl.onEventStart(position);
  }
  private onEventMove(event: TouchEvent | MouseEvent) {
    const position = this.eventToPosition(event);
    // TODO move viewport or wheel
    // console.log("onEventMove", position);
    // console.log(this.activeFlag);
    // this.activeFlag = true;
    if (this.activeFlag) {
      this.toolsCtrl.onEventMoveActive(position);
    } else {
      this.toolsCtrl.onEventMoveInActive(position);
    }
  }

  /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
  private onEventEnd(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    console.log("onEventEnd", position, this.activeFlag);
    if (this.activeFlag) {
      this.toolsCtrl.onEventEnd(position);
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
    // console.log("pos", back);
    return back;
  }

  private resizeCanvas() {
    // 清除畫面
    this.clearCanvas();
    // 設定大小
    this.setCanvasStyle(this.canvas);
    this.setCanvasStyle(this.canvasStatic);
    this.rerender();
    console.log("who");
  }

  private setCanvasStyle(el: HTMLCanvasElement) {
    const clientWidth = window.innerWidth * this.windowRatio;
    const clientHeight = window.innerHeight * this.windowRatio;
    el.setAttribute("width", `${clientWidth * this.devicePixelRatio}px`);
    el.setAttribute("height", `${clientHeight * this.devicePixelRatio}px`);
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

  getPreviewZoom(currentPageZoom: Zoom, ratio: number = this.windowRatio) {
    const canvas = this.canvas;
    const viewportArea = UtilTools.getPointsBox([
      { x: 0, y: 0 },
      {
        x: canvas.width,
        y: canvas.height,
      },
    ]);
    const transform = UtilTools.nextTransform(
      UtilTools.nextTransform(
        UtilTools.nextTransform(defaultTransform, {
          rScale: 1 / currentPageZoom.k,
        }),
        { rScale: 1 / ratio }
      ),
      {
        dx: currentPageZoom.x,
        dy: currentPageZoom.y,
      }
    );
    const { x: vRight, y: vTop } = UtilTools.applyTransform(
      { x: viewportArea.right, y: viewportArea.top },
      transform
    );
    const { x: vLeft, y: vBottom } = UtilTools.applyTransform(
      {
        x: viewportArea.left,
        y: viewportArea.bottom,
      },
      transform
    );

    const topLefts = Array.from(this.shapes).map(([_id, shape]) => {
      console.log(shape);
      const { ne, nw, se } = shape.coveredRect;
      return { y: ne.y || nw.y, x: ne.x || se.x };
    });
    const bottomRights = Array.from(this.shapes).map(([_id, shape]) => {
      const { ne, se, sw } = shape.coveredRect;

      return { y: se.y || sw.y, x: ne.x || se.x };
    });
    const { top, right, bottom, left } = UtilTools.getPointsBox([
      // ...topLefts,
      // ...bottomRights,
      { x: vRight, y: vTop },
      { x: vLeft, y: vBottom },
    ]);
    const width = right - left;
    const height = bottom - top;
    const x = left;
    const y = top;
    const k =
      canvas.width / width < canvas.height / height
        ? canvas.width / width
        : canvas.height / height;
    console.log(this.shapes, { x, y, k });
    // this.zoom = { x, y, k };
    return { x, y, k };
  }
}
