import { BaseTools } from ".";
import { Board } from "..";

export class ViewerTools implements BaseTools {
  readonly board: Board;
  constructor(board: Board) {
    this.board = board;
  }
  onDestroy(): void {}
  onEventStart(v: Vec2): void {}
  onEventMoveActive(v: Vec2): void {}
  onEventMoveInActive(v: Vec2): void {}
  onEventEnd(v: Vec2): void {}
}
