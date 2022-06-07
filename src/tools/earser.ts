import { BaseTools } from ".";
import { BaseShape, Board, defaultDeleteStyle, UtilTools } from "..";

/** 擦子 */
export class EarserTools implements BaseTools {
  readonly board: Board;

  constructor(board: Board) {
    this.board = board;
    board.changeCursor("earser");
  }

  onDestroy(): void {
    this.board.changeCursor("default");
  }

  onEventStart(v: Vec2): void {
    this.checkAndRender(v);
  }

  onEventMoveActive(v: Vec2): void {
    this.checkAndRender(v);
  }

  onEventMoveInActive(v: Vec2): void {}

  onEventEnd(v: Vec2): void {
    this.board.deleteShape();
  }

  private checkAndRender(v: Vec2) {
    this.board.shapes.forEach((bs) => {
      if (
        !bs.isDelete &&
        !bs.isSelect &&
        this.board.ctx.isPointInPath(bs.path, v.x, v.y)
      ) {
        bs.isSelect = true;
        this.board.rerenderToEvent({
          bs: {
            p: bs.path,
            s: { ...bs.style, lineColor: defaultDeleteStyle.lineColor },
          },
        });
      }
    });
  }
}
