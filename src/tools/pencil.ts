import { BaseTools } from "./management";
import { Board, defaultStyle, UtilTools } from "..";
import type { MinRectVec, Styles, Vec2 } from "..";

/** 鉛筆 */
export class PencilTools implements BaseTools {
  /** 繪製到 canvas 上 及 設定畫筆 */
  private board: Board;
  private drawStyle: Styles = defaultStyle;
  /** 能包覆此圖形的最小矩形 */
  private minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  /** 圖形路徑 */
  private path!: Path2D;
  constructor(board: Board) {
    this.board = board;
  }
  onDestroy(): void {}

  changeStyle(s: Styles): void {
    this.drawStyle = s;
  }
  onEventStart(v: Vec2): void {
    this.settingPen();
    this.minRect = { leftTop: v, rightBottom: v };
    this.path = new Path2D();
    this.path.moveTo(v.x - 1, v.y - 1);
    this.path.lineTo(v.x, v.y);
    this.draw();
  }
  onEventMove(v: Vec2): void {
    this.path.lineTo(v.x, v.y);
    this.draw();
    this.minRect = UtilTools.newMinRect(v, this.minRect);
  }
  onEventEnd(v: Vec2): void {
    this.path.lineTo(v.x, v.y);
    this.draw();
    this.addToBoard(v);
    this.drawOver();
  }

  // ----有使用到 board --------------------------
  private settingPen() {
    UtilTools.injectStyle(this.board.ctx, this.drawStyle);
  }
  private draw() {
    this.board.ctx.stroke(this.path);
  }
  private addToBoard(v: Vec2) {
    this.board.addShape(
      this.path,
      this.drawStyle,
      UtilTools.newMinRect(v, this.minRect)
    );
  }
  private drawOver() {
    const { width, height } = this.board.canvas;
    this.board.ctx.clearRect(0, 0, width, height);
  }
}
