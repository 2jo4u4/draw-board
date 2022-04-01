import { BaseTools } from "./management";
import { Board, Vec2 } from "..";

/**
 * 沒選中 / 選中多個 / 選中單個
 */
type SelectFlag = "none" | "multiple" | "single";

/** 選擇器 */
export class SelectTools implements BaseTools {
  private board: Board;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 選取前的畫面 */
  private beforeSelectScreen: ImageData | null = null;
  /** 滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  constructor(board: Board) {
    const { width, height } = board.canvas;
    this.board = board;
    this.beforeSelectScreen = board.ctx.getImageData(0, 0, width, height);
    this.selectFlag = "none";
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
  }
  onEventMove(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        (() => {
          const { x, y } = this.startPosition;
          const { x: nX, y: nY } = v;
          this.board.ctx.putImageData(
            this.beforeSelectScreen as ImageData,
            0,
            0
          );
          this.board.ctx.strokeRect(x, y, nX - x, nY - y);
        })();
        break;
      case "multiple":
        break;
      case "single":
        break;
      default:
        break;
    }
  }
  onEventEnd(v: Vec2): void {
    if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
      // 點擊
      const shape = Array.from(this.board.shapes)
        .reverse()
        .find((item) => item[1].isSelected(v));
      if (shape) {
        shape[1].openSelectRect();
      }
    } else {
      // 移動
      this.board.ctx.putImageData(this.beforeSelectScreen as ImageData, 0, 0);
    }
  }
}
