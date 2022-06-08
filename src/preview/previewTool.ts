import { Board } from "..";
import { BaseTools } from "..";
import { ViewportRect } from "./viewportRect";

const viewportFlexboxStyle: Styles = {
  lineWidth: 4,
  lineColor: "#ff000050",
  lineDash: [10, 10],
};

export class PreviewTools implements BaseTools {
  readonly board: Board;
  readonly flexRectStyle: Styles;
  /** 紀錄滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  /** 固定框 */
  private viewportRect: ViewportRect;

  constructor(board: Board) {
    this.board = board;
    this.flexRectStyle = viewportFlexboxStyle;
    this.viewportRect = new ViewportRect(board);
    this.viewportRect.settingAndOpen();
    this.viewportRect.isSelect = true;
    // this.viewportRect.moveStart(this.startPosition);
  }

  onDestroy(): void {
    this.board.rerender();
    // this.closeWindow();
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
    this.moveStart(v);
  }

  onEventMoveActive(v: Vec2): void {
    // 移動圖形
    this.move(v);
  }

  onEventMoveInActive(v: Vec2): void {
    this.board.rootBlock.style.cursor = "move";
    this.viewportRect.handleInactive(v);
  }

  onEventEnd(v: Vec2): void {
    this.board.rootBlock.style.cursor = "default";
    this.moveEnd(v);
  }

  private moveStart(v: Vec2) {
    this.viewportRect.handleStart(v);
  }

  private move(v: Vec2) {
    this.viewportRect.handleActive(v);
  }

  private moveEnd(v: Vec2) {
    this.viewportRect.handleEnd(v);
  }
}
