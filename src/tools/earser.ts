import type { BaseTools, ToolsManagement } from ".";
import type { Board } from "..";
import { BaseShape, UserAction } from "..";

/** 擦子 */
export class EarserTools implements BaseTools {
  readonly board: Board;
  readonly manager: ToolsManagement;
  private willDeleteShapes: BaseShape[] = [];

  constructor(board: Board, manager: ToolsManagement) {
    this.board = board;
    this.manager = manager;
    board.changeCursor("earser");
  }

  onDestroy(): void {
    this.board.changeCursor("default");
  }

  onEventStart(v: Vec2): void {
    this.checkAndRender(v);
    this.willDeleteShapes = [];
    this.board.sendEvent({ type: UserAction["橡皮擦(開始)"], v, bss: [] });
  }

  onEventMoveActive(v: Vec2): void {
    this.checkAndRender(v);
    this.board.sendEvent({
      type: UserAction["橡皮擦(移動)"],
      v,
      bss: this.willDeleteShapes,
    });
  }

  onEventMoveInActive(v: Vec2): void {}

  onEventEnd(v: Vec2): void {
    this.manager.deleteShape(this.willDeleteShapes);
    this.board.sendEvent({
      type: UserAction["橡皮擦(結束)"],
      v,
      bss: this.willDeleteShapes,
    });
  }

  private checkAndRender(v: Vec2) {
    this.board.shapes.forEach((bs) => {
      if (
        bs.canSelect &&
        !bs.isDelete &&
        !bs.isSelect &&
        this.board.checkPointInPath(bs.pathWithMatrix, v)
      ) {
        bs.canSelect = false;
        bs.willDelete = true;
        this.willDeleteShapes.push(bs);
      }
    });
  }
}
