import {
  BaseShape,
  SocketMiddle,
  UserAction,
  ToolsEnum,
  ToolsManagement,
  MinRectVec,
  Styles,
  Vec2,
  UtilTools,
} from ".";

type MouseFlag = "active" | "inactive";
/**
 * 繪圖板，介接各個插件
 */
export class Board {
  /** Canvas網頁元素 */
  private __canvas: HTMLCanvasElement;
  get canvas(): HTMLCanvasElement {
    return this.__canvas;
  }
  /** 繪版物件 */
  private __ctx: CanvasRenderingContext2D;
  get ctx(): CanvasRenderingContext2D {
    return this.__ctx;
  }
  /** 滑鼠旗標（是否點擊） */
  private mouseFlag: MouseFlag = "inactive";

  /** 所有被繪製的圖形 */
  shapes = new Map<string, BaseShape>();
  /** 紀錄繪圖行為 */
  store: ImageData[] = [];

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
    canvasEl: HTMLElement,
    config?: {
      Socket?: SocketMiddle;
      Tools?: typeof ToolsManagement;
    }
  ) {
    if (canvasEl instanceof HTMLCanvasElement) {
      this.__canvas = canvasEl;
      this.__ctx = canvasEl.getContext("2d") as CanvasRenderingContext2D;
      const { Socket, Tools = ToolsManagement } = Object.assign({}, config);
      this.__tools = new Tools(this);
      this.__socket = Socket ? Socket : null;

      this.initial();
      this.addListener();
    } else {
      throw new Error("請提供 HTMLCanvasElement!!");
    }
  }

  findShape(id: string): BaseShape | undefined {
    return this.shapes.get(id);
  }

  addShape(p: Path2D, s: Styles, m: MinRectVec) {
    const id = UtilTools.RandomID(Array.from(this.shapes.keys()));
    this.shapes.set(id, new BaseShape(id, this, p, s, m));
  }

  initial() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.removeListener();
  }

  /** 可復原 */
  updata(p: Path2D) {
    this.ctx.stroke(p);
    this.saveCanvas();
  }

  saveCanvas() {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.width
    );
    this.store.push(imageData);
  }

  resumeCanvas() {}

  private addListener() {
    this.canvas.addEventListener("mousedown", this.onEventStart.bind(this));
    this.canvas.addEventListener("touchstart", this.onEventStart.bind(this));

    this.canvas.addEventListener("mousemove", this.onEventMove.bind(this));
    this.canvas.addEventListener("touchmove", this.onEventMove.bind(this));

    this.canvas.addEventListener("mouseup", this.onEventEnd.bind(this));
    this.canvas.addEventListener("mouseleave", this.onEventEnd.bind(this));
    this.canvas.addEventListener("touchend", this.onEventEnd.bind(this));
    this.canvas.addEventListener("touchcancel", this.onEventEnd.bind(this));
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
  }

  private onEventStart(event: TouchEvent | MouseEvent) {
    if (this.mouseFlag === "inactive") {
      this.mouseFlag = "active";
      const position = this.eventToPosition(event);
      this.toolsCtrl.onEventStart(position);
    }
  }
  private onEventMove(event: TouchEvent | MouseEvent) {
    let action = UserAction.移動滑鼠;
    if (this.mouseFlag === "active") {
      const position = this.eventToPosition(event);
      this.toolsCtrl.onEventMove(position);
      action =
        this.toolsCtrl.toolsType === ToolsEnum.鉛筆
          ? UserAction.新增
          : UserAction.移動滑鼠;
    }
    if (this.socketCtrl) {
      this.socketCtrl.postData(action);
    }
  }
  private onEventEnd(event: TouchEvent | MouseEvent) {
    if (this.mouseFlag === "active") {
      this.mouseFlag = "inactive";
      const position = this.eventToPosition(event);
      this.toolsCtrl.onEventEnd(position);
    }
  }

  /** 事件轉換座標 */
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
    let box = this.canvas.getBoundingClientRect();
    return {
      x: (x - box.left) / (this.canvas.width / box.width),
      y: (y - box.top) / (this.canvas.height / box.height),
    };
  }
}
