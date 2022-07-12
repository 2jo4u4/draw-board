import type { BaseTools, ToolsManagement } from ".";
import type { Board, Vec2 } from "..";
import { UserAction } from "..";

export class ViewerTools implements BaseTools {
  readonly board: Board;
  readonly manager: ToolsManagement;

  private regPoint: Vec2 = { x: 0, y: 0 };
  constructor(board: Board, manager: ToolsManagement) {
    this.board = board;
    this.manager = manager;
  }
  onDestroy(): void {}
  onEventStart(v: Vec2): void {}
  onEventMoveActive(v: Vec2): void {
    this.justMove(v);
  }
  onEventMoveInActive(v: Vec2): void {
    this.justMove(v);
  }
  onEventEnd(v: Vec2): void {}

  private justMove(v: Vec2) {
    if (this.regPoint.x !== v.x && this.regPoint.y !== v.y) {
      this.regPoint = v;
      this.manager.sendEvent({ type: UserAction.純移動, v, bss: [] });
    }
  }
}
