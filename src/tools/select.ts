import { SelectSolidRect } from "./../shape/selectRect";
import {
  Board,
  BaseShape,
  UtilTools,
  BaseTools,
  defaultFlexboxStyle,
  Rect,
} from "..";

type SelectFlag = "none" | "selected"; // 是否有選到圖形

/** 選擇器 */
export class SelectTools implements BaseTools {
  readonly board: Board;
  readonly flexRectStyle: Styles;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 紀錄滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  /** 固定框 */
  private selectSolidRect: SelectSolidRect;

  constructor(board: Board) {
    this.board = board;
    this.flexRectStyle = defaultFlexboxStyle;
    this.selectFlag = "none";
    this.selectSolidRect = new SelectSolidRect(board);
  }

  onDestroy(): void {
    this.board.shapes.forEach((bs) => {
      bs.isSelect = false;
    });
    this.board.rerender();
    this.selectSolidRect.closeSolidRect();
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
    if (this.selectSolidRect.isCovered(v)) {
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
    this.selectSolidRect.handleInactive(v);
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
    });
    this.board.rerender();
  }

  private select(v: Vec2) {
    const { x, y } = this.startPosition,
      { x: nX, y: nY } = v,
      p = new Path2D(),
      s = this.flexRectStyle;
    p.rect(x, y, nX - x, nY - y);
    this.board.rerenderToEvent({ needClear: true, bs: { p, s } });
  }

  private selectEnd(v: Vec2) {
    let minRectVec!: Rect, // 紀錄最小矩形
      shape: [string, BaseShape][] = [];
    if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
      // 單點選擇圖形
      const single = Array.from(this.board.shapes)
        .reverse()
        .find((item) => !item[1].isDelete && this.isSelected(v, item[1]));
      if (single) {
        shape = [single];
        minRectVec = single[1].coveredRect;
      }
    } else {
      // 移動結束
      const minRect = UtilTools.generateMinRect(v, this.startPosition); // 伸縮框的範圍
      // 判定是否有圖形在此路徑內
      const regBS = Array.from(this.board.shapes).filter(
        (item) => !item[1].isDelete && this.isSelected(minRect, item[1])
      );
      if (regBS.length > 0) {
        shape = regBS;
        minRectVec = UtilTools.mergeMinRect(
          ...regBS.map((bs) => bs[1].coveredRect.rectPoint)
        );
      }
    }
    if (shape[0]) {
      this.selectFlag = "selected";
      shape.forEach((item) => {
        item[1].isSelect = true;
      });
      this.board.rerender();

      this.selectSolidRect.settingAndOpen(minRectVec);
    } else {
      this.board.clearCanvas("event");
      this.selectFlag = "none";
    }

    this.selectSolidRect.isCovered(v);
  }

  private moveStart(v: Vec2) {
    this.selectSolidRect.handleStart(v);
  }

  private move(v: Vec2) {
    this.selectSolidRect.handleActive(v);
  }

  private moveEnd(v: Vec2) {
    this.selectSolidRect.handleEnd(v);
  }

  /** 是否選中 */
  private isSelected(v: Vec2 | Rect, bs: BaseShape): Boolean {
    if (UtilTools.isVec2(v)) {
      return this.board.ctx.isPointInPath(bs.bindingBox, v.x, v.y);
    } else {
      return this.isInRectBlock(v, bs);
    }
  }

  /** 範圍內是否選中 */
  private isInRectBlock(r: Rect, bs: BaseShape): boolean {
    const {
      nw: { x: selectx1, y: selecty1 },
      se: { x: selectx2, y: selecty2 },
    } = r;
    const {
      leftTop: { x: x1, y: y1 },
      rightBottom: { x: x2, y: y2 },
    } = bs.coveredRect.rectPoint;

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
      const fourCorner: Vec2[] = [
        { x: selectx1, y: selecty1 },
        { x: selectx1, y: selecty2 },
        { x: selectx2, y: selecty1 },
        { x: selectx2, y: selecty2 },
      ];
      return Boolean(
        fourCorner.find(({ x, y }) => {
          return this.board.ctx.isPointInPath(bs.bindingBox, x, y);
        })
      );
    }
  }
}
