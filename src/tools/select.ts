import { BaseTools } from "./management";
import { Board, Vec2, BaseShape, MinRectVec, UtilTools, padding } from "..";

/**
 * 沒選中 / 選中
 */
type SelectFlag = "none" | "choose";

/** 選擇器 */
export class SelectTools implements BaseTools {
  private board: Board;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 選取前的畫面 */
  private beforeSelectScreen: ImageData;
  /** 滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  /** 被選中的圖形 */
  private chooseShapes: BaseShape[] = [];
  /** 固定選取框 */
  private selectRect!: Path2D;
  constructor(board: Board) {
    const { width, height } = board.canvas;
    this.board = board;
    this.beforeSelectScreen = board.ctx.getImageData(0, 0, width, height);
    this.selectFlag = "none";
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
    if (
      this.selectRect &&
      this.board.ctx.isPointInPath(this.selectRect, v.x, v.y)
    ) {
      this.selectFlag = "choose";
    } else {
      this.selectFlag = "none";
      this.chooseShapes = [];
      this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0);
    }
  }
  onEventMove(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        // 伸縮選取框
        const { x, y } = this.startPosition;
        const { x: nX, y: nY } = v;
        this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0);
        this.board.ctx.strokeRect(x, y, nX - x, nY - y);
        break;
      case "choose":
        // 移動圖形
        break;
    }
  }
  onEventEnd(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
          // 單點選擇圖形
          const shape = Array.from(this.board.shapes)
            .reverse()
            .find((item) => {
              return this.isSelected(v, item[1]);
            });
          if (shape) {
            const bs = shape[1];
            this.chooseShapes.push(bs);
            this.selectRect = new Path2D(bs.selectRectPath);
            this.board.ctx.stroke(this.selectRect);
          }
        } else {
          // 移動結束
          const minRect = UtilTools.generateMinRect(v, this.startPosition); // 伸縮框的範圍
          this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0); // 清除伸縮框
          // 判定是否有圖形在此路徑內
          const reg: MinRectVec[] = [];
          this.board.shapes.forEach((bs) => {
            if (this.isSelected(minRect, bs)) {
              reg.push(bs.minRect);
            }
          });
          const {
            leftTop: { x: x1, y: y1 },
            rightBottom: { x: x2, y: y2 },
          } = UtilTools.mergeMinRect(...reg);
          this.selectRect = new Path2D();
          this.selectRect.moveTo(x1, y1);
          this.selectRect.rect(
            x1 - padding,
            y1 - padding,
            x2 - x1 + padding * 2,
            y2 - y1 + padding * 2
          );
          this.board.ctx.stroke(this.selectRect);
        }
        this.selectFlag = this.chooseShapes.length > 0 ? "choose" : "none";
        break;
      case "choose":
        // 移動圖形結束

        break;
    }
  }

  private isSelected(v: Vec2 | MinRectVec, bs: BaseShape): Boolean {
    if (this.isVec2(v)) {
      return this.board.ctx.isPointInPath(bs.selectRectPath, v.x, v.y);
    } else {
      return this.isInRectBlock(v, bs);
    }
  }

  private isVec2(v: Vec2 | MinRectVec): v is Vec2 {
    return Object.prototype.hasOwnProperty.call(v, "x");
  }

  private isInRectBlock(r: MinRectVec, bs: BaseShape): boolean {
    const {
      leftTop: { x: selectx1, y: selecty1 },
      rightBottom: { x: selectx2, y: selecty2 },
    } = r;
    const {
      leftTop: { x: x1, y: y1 },
      rightBottom: { x: x2, y: y2 },
    } = bs.minRect;

    return (
      (selectx1 <= x1 || selectx2 >= x2) && (selecty1 <= y1 || selecty2 >= y2)
    );
  }
}
