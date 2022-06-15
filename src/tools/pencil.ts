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
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.minRect = { leftTop: { x, y }, rightBottom: { x, y } };
    const path = UtilTools.minRectToPath(this.minRect);
    this.shape = new BaseShape(
      UtilTools.RandomID(),
      this.board,
      path,
      this.drawStyle,
      new Rect(this.minRect)
    );
    this.board.addShapeByBs(this.shape);
  }

  onEventMoveActive(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.minRect = UtilTools.newMinRect({ x, y }, this.minRect);
    const path = new Path2D(this.shape.path);
    path.lineTo(x, y);
    this.shape.reInit(path, new Rect(this.minRect));
  }

  onEventMoveInActive(v: Vec2): void {
    // nothing
  }

  onEventEnd(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.minRect = UtilTools.newMinRect({ x, y }, this.minRect);
    const p = new Path2D(this.shape.path);
    p.lineTo(x, y);
    this.shape.reInit(p, new Rect(this.minRect));
  }
}
