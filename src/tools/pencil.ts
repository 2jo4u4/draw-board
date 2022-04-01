import { BaseTools } from "./management";
import { Board, defaultStyle, MinRectVec, Styles, UtilTools, Vec2 } from "..";

/** 鉛筆 */
export class PencilTools implements BaseTools {
  private board: Board;
  private drawStyle: Styles = defaultStyle;
  private minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  private path!: Path2D;
  constructor(board: Board) {
    this.board = board;
  }

  changeStyle(s: Styles): void {
    this.drawStyle = s;
  }
  onEventStart(v: Vec2): void {
    this.minRect = { leftTop: v, rightBottom: v };
    this.path = new Path2D();
    this.board.ctx.strokeStyle = this.drawStyle.lineColor;
    this.board.ctx.lineWidth = this.drawStyle.lineWidth;
    this.path.moveTo(v.x - 1, v.y - 1);
    this.path.lineTo(v.x, v.y);
    this.board.ctx.stroke(this.path);
  }
  onEventMove(v: Vec2): void {
    this.path.lineTo(v.x, v.y);
    this.board.ctx.stroke(this.path);
    this.minRect = UtilTools.newMinRect(v, this.minRect);
  }
  onEventEnd(v: Vec2): void {
    this.path.lineTo(v.x, v.y);
    this.board.ctx.stroke(this.path);
    this.board.addShape(
      this.path,
      this.drawStyle,
      UtilTools.newMinRect(v, this.minRect)
    );
  }
}
