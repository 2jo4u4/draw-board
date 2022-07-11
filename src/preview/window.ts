import {
  Board,
  BaseShape,
  BoardShapeLog,
  BaseTools,
  defaultTransform,
  UtilTools,
  ImageShape,
  PDFShape,
} from "..";
import { PreviewMask } from "./mask";
import { PreviewTools } from "./previewTool";

type ActiveFlag = true | false;

/**
 * 控制插件
 */
export class PreviewWindow {
  private __className!: string;
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
  /** Preview Canvas網頁元素 */
  private __maskCanvas!: HTMLCanvasElement;
  get mask(): HTMLCanvasElement {
    return this.__maskCanvas;
  }

  isOpen: ActiveFlag = false;
  private activeFlag: ActiveFlag;
  /** 板子實例 */
  private board: Board;
  previewZoom: Zoom;
  readonly windowRatio: number;
  get previewRatio() {
    return `${this.board.zoom.k * 100}`;
  }
  private __mask!: PreviewMask;
  get maskCtrl() {
    return this.__mask;
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
  private cancelLoopId: number;

  get size(): [number, number] {
    const { width, height } = this.__canvasStatic;
    return [width, height];
  }

  constructor(
    canvas: HTMLCanvasElement | string,
    board: Board,
    options: { className?: string }
  ) {
    if (options.className) this.__className = options.className;
    this.__canvas = UtilTools.getCnavasElement(canvas);
    this.__ctx = UtilTools.checkCanvasContext(this.__canvas);
    this.setStaticCanvas();
    this.devicePixelRatio = window.devicePixelRatio;
    this.board = board;
    this.__shapes = board.shapes;
    this.windowRatio = 1 / 2;
    this.__tools = new PreviewTools(board, this.windowRatio);
    this.initial();
    this.activeFlag = false;
    this.previewZoom = this.getPreviewZoom(board, this.windowRatio);
    this.onEventStart = this.onEventStart.bind(this);
    this.onEventMove = this.onEventMove.bind(this);
    this.onEventEnd = this.onEventEnd.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);

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
      this.renderBaseShape(bs);
    });
    this.toolsCtrl.viewportRect.updata(t);
    this.cancelLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  clearCanvas(type?: "static" | "event") {
    const [width, height] = this.size;
    type !== "static" && this.ctx.clearRect(0, 0, width, height);
    type !== "event" && this.ctxStatic.clearRect(0, 0, width, height);
  }
  renderBaseShape(bs: BaseShape) {
    let ctx: CanvasRenderingContext2D;
    ctx = this.ctx;
    this.render(ctx, bs);
  }
  render(useCtx: CanvasRenderingContext2D, bs: BaseShape) {
    UtilTools.injectStyle(useCtx, bs.style);
    const previewZoomMatrix = UtilTools.getZoomMatrix(this.previewZoom);
    if ((bs instanceof ImageShape || bs instanceof PDFShape) && bs.isLoad) {
      const { x, y } = bs.coveredRect.nw;
      const [width, height] = bs.coveredRect.size;
      useCtx.setTransform(
        DOMMatrix.fromMatrix(bs.finallyMatrix).preMultiplySelf(
          previewZoomMatrix
        )
      );
      useCtx.drawImage(bs.htmlEl, x, y, width, height);
    } else {
      useCtx.setTransform(previewZoomMatrix);
      if (bs.style.fillColor) {
        useCtx.fill(bs.pathWithMatrix);
      } else {
        useCtx.stroke(bs.pathWithMatrix);
      }
      useCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  renderPathToEvent(p: Path2D, s: Styles, m?: DOMMatrix) {
    this.ctx.setTransform(m || new DOMMatrix());
    UtilTools.injectStyle(this.ctx, s);
    if (s.fillColor) {
      this.ctx.fill(p);
    } else {
      this.ctx.stroke(p);
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  initialMask() {
    const mask = document.createElement("canvas");
    this.__maskCanvas = mask;
    this.__mask = new PreviewMask(mask, this.board);
    this.rootBlock.insertAdjacentElement("beforebegin", this.__maskCanvas);
  }

  private initial() {
    this.settingChild();
    this.toolsCtrl.initial();
  }

  open() {
    this.isOpen = true;
    this.updatePreviewZoom();
    this.maskCtrl.open();
    this.display();
  }

  hideWindow() {
    this.isOpen = false;
    this.display();
  }

  close() {
    this.hideWindow();
    this.maskCtrl.close();
    this.display();
  }

  toggle() {
    this.maskCtrl.toggle();
    if (this.isOpen) this.close();
    else this.open();
    this.display();
  }

  display() {
    this.mask.style.display = this.maskCtrl.isOpen ? "inline-flex" : "none";
    this.rootBlock.style.display = this.isOpen ? "inline-flex" : "none";
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

    window.removeEventListener("resize", this.resizeCanvas);
  }

  /** 觸摸/滑鼠下壓 */
  private onEventStart(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
    this.activeFlag = true;
    this.toolsCtrl.onEventStart(position);
  }
  private onEventMove(event: TouchEvent | MouseEvent) {
    const position = this.eventToPosition(event);
    // TODO move viewport or wheel
    if (this.activeFlag) {
      this.toolsCtrl.onEventMoveActive(position);
    } else {
      this.toolsCtrl.onEventMoveInActive(position);
    }
  }

  /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
  private onEventEnd(event: TouchEvent | MouseEvent): void {
    const position = this.eventToPosition(event);
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
    return back;
  }

  private resizeCanvas() {
    // 清除畫面
    this.clearCanvas();
    // 設定大小
    this.setCanvasStyle(this.canvas);
    this.setCanvasStyle(this.canvasStatic);
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
    if (this.__className) {
      this.rootBlock.classList.add(this.__className);
    } else {
      this.rootBlock.style.position = "absolute";
      this.rootBlock.style.display = "none";
      this.rootBlock.style.alignItems = "center";
      this.rootBlock.style.flexDirection = "column";
      this.rootBlock.style.bottom = "0";
      this.rootBlock.style.background = "#fff";
    }
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

  updatePreviewZoom() {
    this.previewZoom = this.getPreviewZoom(this.board, this.windowRatio);
  }

  getPreviewZoom(board: Board, ratio: number) {
    const { canvas, zoom: currentPageZoom } = board;
    const rightBottomTransform = UtilTools.nextTransform(
      UtilTools.nextTransform(
        UtilTools.nextTransform(defaultTransform, {
          rScale: 1 / currentPageZoom.k,
        }),
        { rScale: 1 / ratio }
      ),
      {
        dx: currentPageZoom.x / ratio,
        dy: currentPageZoom.y / ratio,
      }
    );
    const leftTopTransform = UtilTools.nextTransform(
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
    const previewTransform = UtilTools.nextTransform(
      UtilTools.nextTransform(
        UtilTools.nextTransform(
          UtilTools.nextTransform(defaultTransform, {
            rScale: 1 / board.zoom.k,
          }),
          { rScale: 1 / ratio }
        ),
        {
          dx: board.zoom.x,
          dy: board.zoom.y,
        }
      ),
      {
        dx: -board.zoom.x,
        dy: -board.zoom.y,
        rScale: board.zoom.k,
      }
    );
    const { x: vLeft, y: vTop } = UtilTools.applyTransform(
      { x: 0, y: 0 },
      leftTopTransform
    );
    const { x: vRight, y: vBottom } = UtilTools.applyTransform(
      { x: canvas.width, y: canvas.height },
      rightBottomTransform
    );
    const viewportRect: MinRectVec = {
      leftTop: { x: vLeft, y: vTop },
      rightBottom: {
        x: vRight,
        y: vBottom,
      },
    };
    const { x: cLeft, y: cTop } = UtilTools.applyTransform(
      { x: 0, y: 0 },
      previewTransform
    );
    const { x: cRight, y: cBottom } = UtilTools.applyTransform(
      { x: canvas.width, y: canvas.height },
      previewTransform
    );
    const previewRect: MinRectVec = {
      leftTop: { x: cLeft, y: cTop },
      rightBottom: {
        x: cRight,
        y: cBottom,
      },
    };
    const minRectVec = UtilTools.mergeMinRect(
      viewportRect,
      previewRect,
      ...Array.from(board.shapes).map((bs) => {
        return bs[1].coveredRectWithmatrix.rectPoint;
      })
    );
    const [width, height] = minRectVec.size;
    const { x, y } = minRectVec.rectPoint.leftTop;
    const k =
      canvas.width / width < canvas.height / height
        ? canvas.width / width
        : canvas.height / height;
    return { x, y, k };
  }
}
