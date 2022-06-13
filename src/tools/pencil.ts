import { BaseTools } from ".";
import { Board, defaultStyle, Rect, UtilTools } from "..";

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
  /** 圖形路徑 */
  private path!: Path2D;
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
    this.path = new Path2D();
    this.path.moveTo(x - 1, y - 1);
    this.path.lineTo(x, y);
    this.draw();
  }

  onEventMoveActive(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.path.lineTo(x, y);
    this.draw();
    this.minRect = UtilTools.newMinRect({ x, y }, this.minRect);
  }

  onEventMoveInActive(v: Vec2): void {
    // nothing
  }

  onEventEnd(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.path.lineTo(x, y);
    this.draw();
    this.minRect = UtilTools.newMinRect(v, this.minRect);
    this.addToBoard(v);
    this.minRect = UtilTools.newMinRect({ x, y }, this.minRect);
    this.addToBoard({ x, y });
    this.drawOver();
  }

  // ----有使用到 board --------------------------
  private draw() {
    // 畫在事件層級
    this.board.rerenderToEvent({ bs: { p: this.path, s: this.drawStyle } });
  }
  private addToBoard(v: Vec2) {
    // 新增畫好的圖形
    this.board.addShape(this.path, this.drawStyle, new Rect(this.minRect));
  }
  private drawOver() {
    // 畫完後刪除事件層級的圖
    this.board.clearCanvas("event");
  }
}
