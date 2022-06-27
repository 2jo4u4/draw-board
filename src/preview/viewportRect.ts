import { Board, UtilTools, Rect, defaultTransform, defaultZoom } from "..";
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
          x: board.canvas.width,
          y: board.canvas.height,
        }
      )
    );
    this.$type = "viewport-shape";
    this.flag = "translate";
    this.devicePixelRatio = window.devicePixelRatio;
    this.windowRatio = windowRatio;
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: Rect = this.coveredRect) {
    const { x, y, k } = this.board.previewCtrl.getPreviewZoom(
      this.board.zoom,
      this.windowRatio
    );
    this.coveredRect = UtilTools.generateMinRect(
      { x: 0, y: 0 },
      {
        x: this.board.canvas.width,
        y: this.board.canvas.height,
      }
    ).translateSelf(
      new DOMMatrix().translate(x, y).scale(1 / this.board.zoom.k)
    );
    this.assignPathAndDraw();
  }
  drawViewport(previewZoom: Zoom) {
    const { width, height } = this.board.canvas;
    const { x, y, k } = this.board.zoom;
    const { top, right, bottom, left } = UtilTools.getPointsBox([
      { x: 0, y: 0 },
      { x: width, y: height },
    ]);
    const transform = UtilTools.nextTransform(
      UtilTools.nextTransform(
        UtilTools.nextTransform(
          UtilTools.nextTransform(defaultTransform, {
            rScale: 1 / k,
          }),
          { rScale: 1 / this.windowRatio }
        ),
        {
          dx: x,
          dy: y,
        }
      ),
      {
        dx: -previewZoom.x,
        dy: -previewZoom.y,
        rScale: previewZoom.k,
      }
    );
    return transform;
  }

  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    // this.settingBindingBox();
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
  getNextPreviewZoom({ x, y }: Vec2) {
    const prevPreviewZoom = this.board.previewCtrl.getPreviewZoom(
      this.board.zoom,
      this.windowRatio
    );

    return {
      x: this.zoom.x + x / prevPreviewZoom.k,
      y: this.zoom.y + y / prevPreviewZoom.k,
      k: prevPreviewZoom.k,
    };
  }
  updatePageZoom(
    nextPreviewZoom: Zoom,
    previousPreviewZoom: Zoom,
    isMaskZoomLimited = false
  ) {
    const { prevPreviewZoom } = this;

    const { x, y, k } = this.board.zoom;
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
  handleActive(v: Vec2) {
    const prevPreviewZoom = this.board.previewCtrl.getPreviewZoom(
      this.board.zoom,
      this.windowRatio
    );
    this.prevPreviewZoom = prevPreviewZoom;
    switch (this.flag) {
      case "translate": {
        const nextPreviewZoom = this.getNextPreviewZoom({
          x: (v.x - this.startPosition.x) * this.zoom.k, // * Math.sqrt(this.zoom.k),
          y: (v.y - this.startPosition.y) * this.zoom.k, // * Math.sqrt(this.zoom.k),
        });

        this.updatePageZoom(nextPreviewZoom, prevPreviewZoom);

        break;
      }
      case "nw-scale":
        break;
      default:
    }
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
      this.shapes.forEach((bs) => {
        bs.transfer(v, matrix, this.flag);
      });
    }
  }

  override transferEnd(v: Vec2, matrix: DOMMatrix): void {
    if (this.flag !== null) {
      this.coveredRect.translateSelf(matrix);
      this.assignPathAndDraw();
      this.shapes.forEach((bs) => {
        bs.transferEnd(v, matrix, this.flag as ShapeActionType);
      });
    }
  }

  private assignPathAndDraw(path: Path2D | undefined = undefined) {
    const scaleX = 100,
      scaleY = 100,
      zoomPath = new Path2D(),
      m = new DOMMatrix();
    const { nw, ne, sw, se, centerPoint } = this.coveredRect;
    zoomPath.moveTo(nw.x, nw.y);
    zoomPath.lineTo(ne.x, ne.y);
    zoomPath.lineTo(se.x, se.y);
    zoomPath.lineTo(sw.x, sw.y);
    zoomPath.lineTo(nw.x, nw.y);
    m.scale(scaleX, scaleY, 1, centerPoint.x, centerPoint.y);

    const mp = new Path2D();
    mp.addPath(zoomPath, m);

    this.bindingBox = mp;
    this.path = this.bindingBox;
    this.board.previewCtrl?.rerenderToEvent({
      needClear: true,
      bs: { p: path || this.bindingBox, s: defaultSolidboxStyle },
    });
  }

  private clearAllPath() {
    const once = new Path2D();
    this.bindingBox = once;
    this.path = once;
  }
}
