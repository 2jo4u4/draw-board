import { BaseTools } from "./management";
import { Board, BaseShape, UtilTools, padding } from "..";
import type { Vec2, MinRectVec, Styles } from "..";
import trash from "../assets/trash-bin-svgrepo-com.svg";

/**
 * 沒選中 / 選中
 */
type SelectFlag = "none" | "choose";
const defaultFlexboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000050",
};
const defaultSolidboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000080",
};

const dashedLine = [10, 10];
type ActionBarTools = "delete" | "move";
/** 選擇器 */
export class SelectTools implements BaseTools {
  board: Board;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 紀錄滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  /** 被選中的圖形 */
  private chooseShapes: BaseShape[] = [];
  /** 固定的選取框 */
  private solidRect: Path2D | null = null;
  /** 控制/行為 實例 */
  private actionBar: ActionBar;

  constructor(board: Board) {
    this.board = board;
    this.selectFlag = "none";
    this.actionBar = new ActionBar(this, ["delete"]);
  }
  onDestroy(): void {
    const { width, height } = this.board.canvas;
    this.board.ctx.clearRect(0, 0, width, height);
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
      this.chooseShapes = [];
      this.settingFlexBox();
      this.actionBar.closeBar();
    }
  }
  onEventMove(v: Vec2): void {
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
        let minRectVec: MinRectVec | null = null;
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
          // 單點選擇圖形
          const shape = Array.from(this.board.shapes)
            .reverse()
            .find((item) => this.isSelected(v, item[1]));
          if (shape) {
            const bs = shape[1];
            this.chooseShapes.push(bs);
            this.solidRect = new Path2D(bs.selectRectPath);
            minRectVec = bs.minRect;
          } else {
            this.solidRect = null;
          }
        } else {
          // 移動結束
          const minRect = UtilTools.generateMinRect(v, this.startPosition); // 伸縮框的範圍
          // 判定是否有圖形在此路徑內
          const reg: MinRectVec[] = [];
          this.board.shapes.forEach((bs) => {
            if (this.isSelected(minRect, bs)) {
              reg.push(bs.minRect);
              this.chooseShapes.push(bs);
            }
          });
          if (reg.length > 0) {
            minRectVec = UtilTools.mergeMinRect(...reg);
            const {
              leftTop: { x: x1, y: y1 },
              rightBottom: { x: x2, y: y2 },
            } = minRectVec;
            this.solidRect = new Path2D();
            this.solidRect.rect(
              x1 - padding,
              y1 - padding,
              x2 - x1 + padding * 2,
              y2 - y1 + padding * 2
            );
          } else {
            this.solidRect = null;
          }
        }
        if (this.solidRect) {
          this.onSolidBoxStart(); // 固定框開始
          this.board.ctx.stroke(this.solidRect);
          this.onSolidBoxOver(minRectVec); // 固定框結束
        }
        this.selectFlag = this.chooseShapes.length > 0 ? "choose" : "none";
        break;
      case "choose":
        // 移動圖形結束
        break;
    }
  }

  delete() {
    this.board.deleteShape(...this.chooseShapes.map((item) => item.id));
    const { width, height } = this.board.canvas;
    this.board.ctx.clearRect(0, 0, width, height);
  }

  /** 是否選中 */
  private isSelected(v: Vec2 | MinRectVec, bs: BaseShape): Boolean {
    if (UtilTools.isVec2(v)) {
      return this.board.ctx.isPointInPath(bs.selectRectPath, v.x, v.y);
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
          return this.board.ctx.isPointInPath(bs.selectRectPath, x, y);
        })
      );
    }
  }

  /** 選取的伸縮框設定 */
  private settingFlexBox() {
    this.board.ctx.setLineDash(dashedLine);
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
    // 清除虛線
    this.board.ctx.setLineDash([]);
  }

  /** 選取固定框設定 */
  private onSolidBoxStart() {
    this.board.ctx.setLineDash(dashedLine);
    UtilTools.injectStyle(this.board.ctx, defaultSolidboxStyle);
  }

  /** 選取固定框清除設定 */
  private onSolidBoxOver(mr: MinRectVec | null) {
    this.board.ctx.setLineDash([]);
    mr && this.actionBar.openBar(mr);
  }
}

const interval = 60; //px
class ActionBar {
  private selectTools: SelectTools;
  private board: Board;
  private rootBlock: HTMLDivElement;
  private block: HTMLDivElement;
  private openFlag = false;

  constructor(selectTools: SelectTools, use: ActionBarTools[]) {
    this.selectTools = selectTools;
    this.board = selectTools.board;
    this.rootBlock = selectTools.board.rootBlock;
    this.block = document.createElement("div");
    this.initial(use);
  }

  private initial(use: ActionBarTools[]) {
    this.block.style.position = "absolute";
    this.block.style.border = "1px solid red";
    this.icon(use);
  }

  openBar(mr: MinRectVec) {
    if (!this.openFlag) {
      this.openFlag = true;
      const {
        leftTop: { x: x1, y: y1 },
        rightBottom: { x: x2, y: y2 },
      } = mr;
      const width = x2 - x1 + padding * 2 + defaultSolidboxStyle.lineWidth * 2;
      this.block.style.top = `${y1 - interval}px`;
      this.block.style.left = `${
        x1 - padding - defaultSolidboxStyle.lineWidth
      }px`;
      this.block.style.width = `${width}px`;
      this.rootBlock.append(this.block);
    }
  }

  closeBar() {
    if (this.openFlag) {
      this.openFlag = false;
      this.block.remove();
    }
  }

  private icon(type: ActionBarTools[]) {
    type.forEach((item) => {
      const img = new Image(24, 24);
      img.style.cursor = "pointer";
      img.src = trash;
      img.onclick = () => {
        this.selectTools.delete();
        this.block.remove();
      };
      this.block.append(img);
    });
  }
}
