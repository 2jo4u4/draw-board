import { Board, padding, UtilTools } from "..";
import { BaseShape } from "../shape";
import { Rect } from "../util";

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
  shapes: BaseShape[] = [];

  constructor(board: Board) {
    super(
      "viewportRect_onlyOne",
      board,
      new Path2D(),
      defaultSolidboxStyle,
      new Rect()
    );
    this.$type = "viewport-shape";
    super.moveStart({ x: 0, y: 0 }); // need init regPosition
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: MinRectVec) {
    this.setting(mrv);
    this.board.rerender();
  }

  /** 設定路徑 及 矩形 */
  setting(mrv: MinRectVec) {
    this.minRect = mrv;
    this.settingPath(UtilTools.minRectToPath(mrv));
    this.shapes = Array.from(this.board.shapes)
      .filter((bs) => !bs[1].isDelete && bs[1].isSelect)
      .map((bs) => bs[1]);
  }

  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    this.settingPath();
  }

  override moveStart(v: Vec2): void {
    this.shapes.forEach((bs) => {
      bs.moveStart(v);
    });
    super.moveStart(v);
  }

  override move(v: Vec2): void {
    // 在事件層移動圖形
    this.board.clearCanvas("event");
    this.shapes.forEach((bs) => {
      bs.move(v);
    });
    super.move(v);
  }

  override moveEnd(v: Vec2): void {
    // 將圖形放回圖層級
    this.board.clearCanvas();
    this.shapes.forEach((bs) => {
      bs.moveEnd(v);
    });
    super.moveEnd(v);
  }

  private settingPath(p?: Path2D) {
    if (p) {
      this.bindingBox = p;
    } else {
      const path = new Path2D();
      this.bindingBox = path;
    }
  }
}
