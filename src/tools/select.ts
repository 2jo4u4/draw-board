import type { ToolsManagement } from ".";
import type { Board, BaseShape, BaseTools, Styles, Vec2 } from "..";
import { SelectSolidRect } from "./../shape/selectRect";
import { UtilTools, defaultFlexboxStyle, Rect, UserAction } from "..";

type SelectFlag = "none" | "selected"; // 是否有選到圖形

/** 選擇器 */
export class SelectTools implements BaseTools {
  readonly board: Board;
  readonly manager: ToolsManagement;
  readonly flexRectStyle: Styles;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 紀錄滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  /** 固定框 */
  private selectSolidRect: SelectSolidRect;
  private isSelectShapes: BaseShape[] = [];

  constructor(board: Board, manager: ToolsManagement) {
    this.board = board;
    this.manager = manager;
    this.flexRectStyle = defaultFlexboxStyle;
    this.selectFlag = "none";
    this.selectSolidRect = new SelectSolidRect(board, manager);
    manager.addToolsShape(this.selectSolidRect);
  }

  onDestroy(): void {
    this.recoverShapesStatus();
    this.selectSolidRect.closeSolidRect();
    this.manager.removeToolsShape(this.selectSolidRect);
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

  private recoverShapesStatus() {
    this.isSelectShapes.forEach((bs) => {
      bs.isSelect = false;
      bs.canSelect = true;
    });
  }

  private selectStart(v: Vec2) {
    this.recoverShapesStatus();
    this.selectSolidRect.closeSolidRect();
    this.isSelectShapes = [];
    this.manager.sendEvent({ type: UserAction["選取圖形(開始)"], v, bss: [] });
  }

  private select(v: Vec2) {
    const p = new Path2D();
    const { x, y } = UtilTools.unZoomPosition(
      this.board.zoom,
      this.startPosition
    );
    const { x: nX, y: nY } = UtilTools.unZoomPosition(this.board.zoom, v);
    p.rect(x, y, nX - x, nY - y);
    this.selectSolidRect.path = p;
  }

  private selectEnd(v: Vec2) {
    this.selectSolidRect.path = new Path2D();
    let minRectVec!: Rect, // 紀錄最小矩形
      shape: [string, BaseShape][] = [];
    const { x, y } = UtilTools.unZoomPosition(
      this.board.zoom,
      this.startPosition
    );
    const { x: nX, y: nY } = UtilTools.unZoomPosition(this.board.zoom, v);
    if (x === nX && y === nY) {
      // 單點選擇圖形
      const single = Array.from(this.board.shapes)
        .reverse()
        .find(
          (item) =>
            item[1].canSelect &&
            !item[1].isDelete &&
            this.isSelected(v, item[1])
        );
      if (single) {
        shape = [single];
        minRectVec = single[1].coveredRectWithmatrix;
      }
    } else {
      // 移動結束
      const minRect = UtilTools.generateMinRect({ x: nX, y: nY }, { x, y }); // 伸縮框的範圍
      // 判定是否有圖形在此路徑內
      const regBS = Array.from(this.board.shapes).filter(
        (item) =>
          item[1].canSelect &&
          !item[1].isDelete &&
          this.isSelected(minRect, item[1])
      );
      if (regBS.length > 0) {
        shape = regBS;
        if (regBS.length === 1) {
          minRectVec = regBS[0][1].coveredRectWithmatrix;
        } else {
          minRectVec = UtilTools.mergeMinRect(
            ...regBS.map((bs) => bs[1].coveredRectWithmatrix.rectPoint)
          );
        }
      }
    }

    if (shape[0]) {
      this.selectFlag = "selected";
      this.isSelectShapes = shape.map((item) => {
        item[1].isSelect = true;
        item[1].canSelect = false;
        return item[1];
      });
      this.selectSolidRect.settingAndOpen(minRectVec, this.isSelectShapes);
    } else {
      this.isSelectShapes = [];
      this.selectFlag = "none";
    }
    this.selectSolidRect.isCovered(v);
    this.manager.sendEvent({
      type: UserAction["選取圖形(結束)"],
      v,
      bss: this.isSelectShapes,
    });
  }

  private moveStart(v: Vec2) {
    this.selectSolidRect.handleStart(v);
    this.manager.sendEvent({
      type: UserAction["變形(開始)"],
      v,
      bss: this.isSelectShapes,
    });
  }

  private move(v: Vec2) {
    this.selectSolidRect.handleActive(v);
    this.manager.sendEvent({
      type: UserAction["變形(過程)"],
      v,
      bss: this.isSelectShapes,
    });
  }

  private moveEnd(v: Vec2) {
    this.selectSolidRect.handleEnd(v);
    this.manager.sendEvent({
      type: UserAction["變形(結束)"],
      v,
      bss: this.isSelectShapes,
    });
  }

  /** 是否選中 */
  private isSelected(v: Vec2 | Rect, bs: BaseShape): Boolean {
    if (UtilTools.isVec2(v)) {
      const nV = UtilTools.unZoomPosition(this.board.zoom, v as Vec2);
      return this.board.checkPointInPath(bs.bindingBoxWithMatrix, nV);
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
    } = bs.coveredRectWithmatrix.rectPoint;

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
        fourCorner.find((v) => {
          return this.board.checkPointInPath(bs.bindingBoxWithMatrix, v);
        })
      );
    }
  }
}
