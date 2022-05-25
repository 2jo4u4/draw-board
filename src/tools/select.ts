import { SelectSolidRect } from "./../shape/selectRect";
import { BaseTools } from "./management";
import { Board, BaseShape, UtilTools, dashedLine } from "..";

/**
 * 沒選中 / 選中
 */
type SelectFlag = "none" | "selected";
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
  /** 固定框 */
  private selectSolidRect: SelectSolidRect;

  constructor(board: Board) {
    this.board = board;
    this.selectFlag = "none";
    this.selectSolidRect = new SelectSolidRect(board);
  }

  onDestroy(): void {
    this.board.clearCanvas("event");
    this.selectSolidRect.closeSolidRect();
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
    if (
      this.board.ctx.isPointInPath(this.selectSolidRect.bindingBox, v.x, v.y)
    ) {
      this.selectFlag = "selected";
      this.moveStart(v);
    } else {
      this.selectFlag = "none";
      this.selectStart(v);
    }
  }

  onEventMoveActive(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        // 伸縮選取框
        this.select(v);
        break;
      case "selected":
        // 移動圖形
        this.move(v);
        break;
    }
  }

  onEventMoveInActive(v: Vec2): void {
    if (
      this.board.ctx.isPointInPath(this.selectSolidRect.bindingBox, v.x, v.y)
    ) {
      this.board.rootBlock.style.cursor = "move";
    } else {
      this.board.rootBlock.style.cursor = "default";
    }
  }

  onEventEnd(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        this.selectEnd(v);
        break;
      case "selected":
        this.moveEnd(v);
        break;
    }
  }

  private selectStart(v: Vec2) {
    // 清除已選圖形 + 刪除標記 + 放回圖層級
    this.selectSolidRect.closeSolidRect();
    this.board.shapes.forEach((bs) => {
      bs.isSelect = false;
      this.board.drawByBs(bs);
    });
    this.settingFlexBox();
  }

  private select(v: Vec2) {
    const { width, height } = this.board.canvas,
      { x, y } = this.startPosition,
      { x: nX, y: nY } = v;
    // 先清空上一步的選取伸縮框
    this.board.ctx.clearRect(0, 0, width, height);
    // 繪製下一步的伸縮框
    this.board.ctx.strokeRect(x, y, nX - x, nY - y);
  }

  private selectEnd(v: Vec2) {
    this.drawOverFlexBox(); // 伸縮框結束
    let minRectVec!: MinRectVec, // 紀錄最小矩形
      shape: [string, BaseShape][] = [];
    if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
      // 單點選擇圖形
      const single = Array.from(this.board.shapes)
        .reverse()
        .find((item) => this.isSelected(v, item[1]));
      if (single) {
        shape = [single];
        minRectVec = single[1].minRect;
      }
    } else {
      // 移動結束
      const minRect = UtilTools.generateMinRect(v, this.startPosition); // 伸縮框的範圍
      // 判定是否有圖形在此路徑內
      const regBS = Array.from(this.board.shapes).filter((item) =>
        this.isSelected(minRect, item[1])
      );
      if (regBS.length > 0) {
        shape = regBS;
        minRectVec = UtilTools.mergeMinRect(
          ...regBS.map((bs) => bs[1].minRect)
        );
      }
    }
    if (shape[0]) {
      this.selectFlag = "selected";
      this.board.clearCanvas(); // 將選中的圖形提升至事件層前需再次重繪
      this.selectSolidRect.settingAndOpen(
        minRectVec,
        ...shape.map((bs) => {
          // 標記被選中的圖形
          bs[1].isSelect = true;
          return bs[1];
        })
      );
      // 將選中的圖形提升至事件層
      this.board.shapes.forEach((bs) => {
        if (bs.isSelect) {
          UtilTools.injectStyle(this.board.ctx, bs.style);
          this.board.ctx.stroke(bs.path);
        } else {
          this.board.drawByBs(bs);
        }
      });
      this.board.rootBlock.style.cursor = "move";
    } else {
      this.selectFlag = "none";
      this.board.rootBlock.style.cursor = "default";
    }
  }

  private moveStart(v: Vec2) {
    this.selectSolidRect.moveStart(v);
  }

  private move(v: Vec2) {
    this.selectSolidRect.move(v);
  }

  private moveEnd(v: Vec2) {
    this.selectSolidRect.moveEnd(v);
  }

  /** 是否選中 */
  private isSelected(v: Vec2 | MinRectVec, bs: BaseShape): Boolean {
    if (UtilTools.isVec2(v)) {
      return this.board.ctx.isPointInPath(bs.bindingBox, v.x, v.y);
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
          return this.board.ctx.isPointInPath(bs.bindingBox, x, y);
        })
      );
    }
  }

  /** 選取的伸縮框設定 */
  private settingFlexBox() {
    UtilTools.injectStyle(this.board.ctx, defaultFlexboxStyle);
  }

  /** 選取伸縮框結束 */
  private drawOverFlexBox() {
    this.board.clearCanvas("event");
  }
}
