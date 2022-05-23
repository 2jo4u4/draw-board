import { BaseTools } from "./management";
import { Board, BaseShape, UtilTools, dashedLine } from "..";

/**
 * 沒選中 / 選中
 */
type SelectFlag = "none" | "choose";
const defaultFlexboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000050",
  lineDash: dashedLine,
};

/** 選擇器 */
export class SelectTools implements BaseTools {
  readonly board: Board;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 紀錄滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  /** 紀錄固定的選取框（判定下次選取是否需要變更狀態） */
  private solidRect: Path2D | null = null;

  constructor(board: Board) {
    this.board = board;
    this.selectFlag = "none";
  }
  onEventMoveInActive(v: Vec2): void {
    throw new Error("Method not implemented.");
  }
  onDestroy(): void {
    const { width, height } = this.board.canvas;
    this.board.ctx.clearRect(0, 0, width, height);
    this.board.shapes.forEach((item) => {
      item.actionBar.closeBar();
    });
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
    if (
      this.solidRect &&
      this.board.ctx.isPointInPath(this.solidRect, v.x, v.y)
    ) {
      this.selectFlag = "choose";
    } else {
      this.selectFlag = "none";
      // 清除已選圖形
      this.board.shapes.forEach((bs) => {
        bs.closeSolidRect();
      });
      this.settingFlexBox();
    }
  }
  onEventMoveActive(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        // 伸縮選取框
        this.drawFlexBox(v);
        break;
      case "choose":
        // 移動圖形
        break;
    }
  }
  onEventEnd(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        this.drawOverFlexBox(); // 伸縮框結束
        let minRectVec: MinRectVec | undefined = undefined, // 紀錄多選下的最小矩形
          shape: [string, BaseShape] | undefined = undefined;
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
          // 單點選擇圖形
          shape = Array.from(this.board.shapes)
            .reverse()
            .find((item) => this.isSelected(v, item[1]));
        } else {
          // 移動結束
          const minRect = UtilTools.generateMinRect(v, this.startPosition); // 伸縮框的範圍
          // 判定是否有圖形在此路徑內
          const regBS = Array.from(this.board.shapes).filter((item) =>
            this.isSelected(minRect, item[1])
          );
          if (regBS.length > 0) {
            shape = regBS[0]; // 只呼叫第一個圖形
            minRectVec = UtilTools.mergeMinRect(
              ...regBS.map((_bs) => _bs[1].minRect)
            );
            // 標記其餘被選中圖形
            for (let i = 1; i < regBS.length; i++) {
              const bs = regBS[i][1];
              bs.isSelect = true;
            }
          }
        }
        if (shape) {
          this.selectFlag = "choose";
          const bs = shape[1];
          this.solidRect = UtilTools.drawMinRectVecPath(
            minRectVec || bs.minRect
          );
          bs.openSolidRect({ mrv: minRectVec, openBar: true });
        } else {
          this.selectFlag = "none";
          this.solidRect = null;
        }
        break;
      case "choose":
        // 移動圖形結束
        break;
    }
  }

  /** 是否選中 */
  private isSelected(v: Vec2 | MinRectVec, bs: BaseShape): Boolean {
    if (UtilTools.isVec2(v)) {
      return this.board.ctx.isPointInPath(bs.solidRectPath, v.x, v.y);
    } else {
      return this.isInRectBlock(v, bs);
    }
  }

  /** 範圍內是否選中 */
  private isInRectBlock(r: MinRectVec, bs: BaseShape): boolean {
    const {
      leftTop: { x: selectx1, y: selecty1 },
      rightBottom: { x: selectx2, y: selecty2 },
    } = r;
    const {
      leftTop: { x: x1, y: y1 },
      rightBottom: { x: x2, y: y2 },
    } = bs.minRect;

    if (selectx1 <= x1 && selecty1 <= y1 && selectx2 >= x2 && selecty2 >= y2) {
      // 完全包覆
      return true;
    } else if (
      x1 < selectx1 &&
      y1 < selecty1 &&
      x2 > selectx2 &&
      y2 > selecty2
    ) {
      // 被包覆(選取框大小 小於 圖形大小)
      return true;
    } else if (
      selectx1 <= x1 &&
      selectx2 >= x2 &&
      ((selecty2 > y1 && selecty2 < y2) || (selecty1 > y1 && selecty1 < y2))
    ) {
      // Ｘ軸包覆，由Ｙ軸判定
      return true;
    } else if (
      selecty1 <= y1 &&
      selecty2 >= y2 &&
      ((selectx2 > x1 && selectx2 < x2) || (selectx1 > x1 && selectx1 < x2))
    ) {
      // Ｙ軸包覆，由Ｘ軸判定
      return true;
    } else {
      // Ｘ軸Ｙ軸都被半包覆(四頂點處在圖形內)
      // 或 沒被包覆
      const foreCorner: Vec2[] = [
        { x: selectx1, y: selecty1 },
        { x: selectx1, y: selecty2 },
        { x: selectx2, y: selecty1 },
        { x: selectx2, y: selecty2 },
      ];
      return Boolean(
        foreCorner.find(({ x, y }) => {
          return this.board.ctx.isPointInPath(bs.solidRectPath, x, y);
        })
      );
    }
  }

  /** 選取的伸縮框設定 */
  private settingFlexBox() {
    UtilTools.injectStyle(this.board.ctx, defaultFlexboxStyle);
  }
  /** 繪製選取的伸縮框 */
  private drawFlexBox(v: Vec2) {
    const { width, height } = this.board.canvas,
      { x, y } = this.startPosition,
      { x: nX, y: nY } = v;
    // 先清空上一步的選取伸縮框
    this.board.ctx.clearRect(0, 0, width, height);
    // 繪製下一步的伸縮框
    this.board.ctx.strokeRect(x, y, nX - x, nY - y);
  }
  /** 選取伸縮框結束 */
  private drawOverFlexBox() {
    const { width, height } = this.board.canvas;
    // 清空選取伸縮框
    this.board.ctx.clearRect(0, 0, width, height);
  }
}
