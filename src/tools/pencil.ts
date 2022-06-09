import { BaseTools } from ".";
import { BaseShape, Board, defaultStyle, Rect, UtilTools } from "..";

/** 鉛筆 */
export class PencilTools implements BaseTools {
  /** 繪製到 canvas 上 及 設定畫筆 */
  readonly board: Board;
  private drawStyle: Styles;
  /** 能包覆此圖形的最小矩形 */
  private minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  shape!: BaseShape;
  /** 圖形路徑 */
  constructor(board: Board, drawStyle = defaultStyle) {
    this.board = board;
    this.drawStyle = drawStyle;
    board.changeCursor("earser");
    board.changeCursor("pencil");
  }

  onDestroy(): void {
    this.board.changeCursor("default");
  }

  changeStyle(s: Styles): void {
    this.drawStyle = s;
  }

  onEventStart(v: Vec2): void {
    this.minRect = { leftTop: v, rightBottom: v };
    const path = new Path2D();
    path.arc(v.x, v.y, 1, 0, 2 * Math.PI);
    this.shape = new BaseShape(
      UtilTools.RandomID(),
      this.board,
      path,
      this.drawStyle,
      new Rect(),
      new DOMMatrix()
    );
    this.board.addShapeByBs(this.shape);
  }

  onEventMoveActive(v: Vec2): void {
    const p = new Path2D(this.shape.path);
    p.lineTo(v.x, v.y);
    this.minRect = UtilTools.newMinRect(v, this.minRect);
    this.shape.reInit(p, new Rect(this.minRect));
  }

  onEventMoveInActive(v: Vec2): void {
    // nothing
  }

  onEventEnd(v: Vec2): void {
    const p = new Path2D(this.shape.path);
    p.lineTo(v.x, v.y);
    this.minRect = UtilTools.newMinRect(v, this.minRect);
    this.shape.reInit(p, new Rect(this.minRect));
  }
}
