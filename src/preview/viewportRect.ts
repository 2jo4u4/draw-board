import { Board, UtilTools, defaultTransform, defaultZoom } from "..";
import { BaseShape } from "../shape";

const defaultSolidboxStyle: Styles = {
  lineWidth: 4,
  lineColor: "red",
  lineDash: [10, 10],
  fillColor: undefined,
};

/** 特殊圖形，用以畫出被選擇的圖形框 */
export class ViewportRect extends BaseShape {
  readonly $type;
  private zoom!: Zoom;
  private prevPreviewZoom!: Zoom;
  /** 紀錄被選取的圖形 */
  startPosition!: Vec2;
  shapes: BaseShape[] = [];
  flag: ShapeActionType | null;
  readonly windowRatio: number;
  /** 像素密度 */
  readonly devicePixelRatio!: number;

  constructor(board: Board, windowRatio: number = 1) {
    super(
      "viewportRect_onlyOne",
      board,
      new Path2D(),
      defaultSolidboxStyle,
      UtilTools.generateMinRect(
        { x: 0, y: 0 },
        {
          x: board.canvas.width * windowRatio,
          y: board.canvas.height * windowRatio,
        }
      )
    );
    this.$type = "viewport-shape";
    this.flag = "translate";
    this.devicePixelRatio = window.devicePixelRatio;
    this.windowRatio = windowRatio;
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  render() {
    this.assignPathAndDraw();
  }

  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    this.clearAllPath();
    this.shapes = [];
    this.board.changeCursor("default");
  }

  handleStart(v: Vec2) {
    this.startPosition = v;
    const { x, y, k } = this.board.zoom;
    this.zoom = { x, y, k };
    // TODO flag: zoom, move
    switch (this.flag) {
      case "translate":
        this.board.changeCursor("grabbing");
        break;
      case "nw-scale":
        break;
      default:
    }
  }
  getNextPageZoom({ x, y }: Vec2) {
    const { prevPreviewZoom } = this;
    return {
      x: this.zoom.x + x / prevPreviewZoom.k,
      y: this.zoom.y + y / prevPreviewZoom.k,
      k: this.zoom.k,
    };
  }
  getPreviousPageZoom(width: number, height: number): Zoom {
    const {
      zoom: { k },
      prevPreviewZoom,
    } = this;
    return {
      x:
        prevPreviewZoom.x +
        (width / prevPreviewZoom.k) *
          (1 / prevPreviewZoom.k - 1 / (k * this.windowRatio)),
      y:
        prevPreviewZoom.y +
        (height / prevPreviewZoom.k) *
          (1 / prevPreviewZoom.k - 1 / (k * this.windowRatio)),
      k,
    };
  }
  updatePageZoom(
    nextPageZoom: Zoom,
    previousPageZoom: Zoom,
    isMaskZoomLimited = true
  ) {
    const { prevPreviewZoom } = this;
    const { k } = this.board.zoom;
    const { x: nx, y: ny } = nextPageZoom;
    const { x: px, y: py } = previousPageZoom;

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

  handleActive(v: Vec2) {
    const prevPreviewZoom = this.board.previewCtrl.getPreviewZoom(
      this.board,
      this.windowRatio
    );
    this.prevPreviewZoom = prevPreviewZoom;
    const [width, height] = this.coveredRect.size;
    const previousPageZoom = this.getPreviousPageZoom(
      width * this.windowRatio,
      height * this.windowRatio
    );
    const nextPageZoom = this.getNextPageZoom({
      x: v.x - this.startPosition.x,
      y: v.y - this.startPosition.y,
    });

    this.updatePageZoom(nextPageZoom, previousPageZoom);
  }
  handleInactive(v: Vec2) {
    if (this.shapes.length > 0) {
      if (this.board.checkPointInPath(this.path, v)) {
        this.board.changeCursor("move");
      } else {
        this.board.changeCursor("default");
      }
    }
  }
  handleEnd(v: Vec2) {
    switch (this.flag) {
      case "translate": {
        break;
      }
      case "nw-scale":
        break;
      default:
    }
  }

  override transfer(v: Vec2, matrix: DOMMatrix): void {
    if (this.flag !== null) {
      const newPath = new Path2D();
      newPath.addPath(this.path, matrix);
      this.assignPathAndDraw(newPath);
    }
  }

  override transferEnd(v: Vec2, matrix: DOMMatrix): void {
    if (this.flag !== null) {
      this.coveredRect.transferSelf(matrix);
      this.assignPathAndDraw();
    }
  }

  override updata(t: number) {
    this.assignPathAndDraw();
  }

  private assignPathAndDraw(path: Path2D | undefined = undefined) {
    const coveredPath = new Path2D();
    const { nw, ne, sw, se } = this.coveredRect;
    const previewZoom = this.getViewportZoom(this.board, this.windowRatio);

    coveredPath.moveTo(nw.x, nw.y);
    coveredPath.lineTo(ne.x, ne.y);
    coveredPath.lineTo(se.x, se.y);
    coveredPath.lineTo(sw.x, sw.y);
    coveredPath.lineTo(nw.x, nw.y);

    this.bindingBox = coveredPath;
    this.path = this.bindingBox;
    this.board.previewCtrl.renderPathToEvent(
      path || this.bindingBox,
      defaultSolidboxStyle,
      previewZoom
    );
  }

  private getViewportZoom(board: Board, ratio: number) {
    const {
      zoom: currentPageZoom,
      previewCtrl: { previewZoom },
    } = board;
    const transform = UtilTools.nextTransform(
      UtilTools.nextTransform(
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
      ),
      {
        dx: -previewZoom.x,
        dy: -previewZoom.y,
        rScale: previewZoom.k,
      }
    );
    return transform as DOMMatrix;
  }

  private clearAllPath() {
    const once = new Path2D();
    this.bindingBox = once;
    this.path = once;
  }
}
