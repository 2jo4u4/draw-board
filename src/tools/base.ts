import { Board } from "..";

export abstract class BaseTools {
  constructor(board: Board) {}
  onEventStart(v: Vec2): void {}
  onEventMoveActive(v: Vec2): void {}
  onEventMoveInActive(v: Vec2): void {}
  onEventEnd(v: Vec2): void {}
  onDestroy(): void {}
}
