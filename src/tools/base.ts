import type { Board, Vec2 } from "..";

export abstract class BaseTools {
  constructor(board: Board) {}
  abstract onEventStart(v: Vec2): void;
  abstract onEventMoveActive(v: Vec2): void;
  abstract onEventMoveInActive(v: Vec2): void;
  abstract onEventEnd(v: Vec2): void;
  abstract onDestroy(): void;
  abstract onInit(): void;
}
