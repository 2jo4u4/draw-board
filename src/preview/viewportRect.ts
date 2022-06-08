import { Board, padding, UtilTools, Rect } from "..";
import { BaseShape } from "../shape";

const defaultSolidboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000080",
  lineDash: [10, 10],
  fillColor: undefined,
};

/** 特殊圖形，用以畫出被選擇的圖形框 */
export class ViewportRect extends BaseShape {
  readonly $type;
  /** 紀錄被選取的圖形 */
  startPosition!: Vec2;
  shapes: BaseShape[] = [];
  path!: Path2D;
  flag: ShapeActionType | null;

  constructor(board: Board) {
    super(
      "viewportRect_onlyOne",
      board,
      new Path2D(),
      defaultSolidboxStyle,
      new Rect()
    );
    this.$type = "viewport-shape";
    // super.moveStart({ x: 0, y: 0 }); // need init regPosition
    this.flag = "translate";
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: Rect = this.coveredRect) {
    const clone = mrv.clone();
    console.log(mrv);
    this.coveredRect = clone;
    this.assignPathAndDraw();
    // this.board.rerender();
    // this.board.previewCtrl.rerender();
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
  handleActive(v: Vec2) {
    switch (this.flag) {
      case "translate":
        this.transfer(v, UtilTools.translate(this.startPosition, v));
        break;
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
      case "translate":
        this.transferEnd(v, UtilTools.translate(this.startPosition, v));
        break;
      case "nw-scale":
        break;
      default:
    }
  }

  override transfer(v: Vec2, matrix: DOMMatrix): void {
    if (this.flag !== null) {
      console.log("transfer", v, matrix);
      this.board.clearCanvas("event");
      this.shapes.forEach((bs) => {
        bs.transfer(v, matrix);
      });
      super.transfer(v, matrix);
    }
  }

  override transferEnd(v: Vec2, matrix: DOMMatrix): void {
    if (this.flag !== null) {
      this.board.clearCanvas("event");
      this.shapes.forEach((bs) => {
        bs.transferEnd(v, matrix, this.flag as ShapeActionType);
      });
      super.transferEnd(v, matrix, this.flag);
    }
  }

  private assignPathAndDraw() {
    this.bindingBox = UtilTools.minRectToPath(this.coveredRect);
    this.path = this.bindingBox;
    console.log(this.board);
    this.board.previewCtrl?.rerenderToEvent({
      bs: { p: this.bindingBox, s: defaultSolidboxStyle },
    });
  }

  private clearAllPath() {
    const once = new Path2D();
    this.bindingBox = once;
    this.path = once;
  }
}
