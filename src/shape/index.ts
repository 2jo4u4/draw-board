import { Board, defaultStyle, padding, UtilTools, Rect } from "..";
interface ShapeAction {
  type: ShapeActionType;
  matrix: DOMMatrix;
}
/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type;
  readonly id: string;
  readonly board: Board;
  /** 圖形路徑 */
  path: Path2D;
  /** 樣式 */
  style: Styles;
  /**
   * @deprecated 用 coveredRect 代替
   *
   * 紀錄一個路徑的最小包覆矩形
   */
  minRect: MinRectVec;

  /** 紀錄一個路徑的最小包覆矩形 */
  coveredRect: Rect;
  /** 判斷是否被選取的路徑 */
  bindingBox: Path2D;
  /** 是否被選取 */
  private __isSelect = false;
  get isSelect() {
    return this.__isSelect;
  }
  set isSelect(b: boolean) {
    this.__isSelect = this.__isDelete ? false : b;
  }
  /** 是否被刪除 */
  private __isDelete = false;
  get isDelete() {
    return this.__isDelete;
  }
  set isDelete(b: boolean) {
    this.__isSelect = false;
    this.__isDelete = b;
  }

  /** 紀錄 */
  shapeActionLog: ShapeAction[] = [];
  shapeActionLimit: number;

  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles,
    minRect: MinRectVec | Rect
  ) {
    this.$type = "base-shape";
    this.id = id;
    this.board = board;
    this.path = new Path2D(path);
    this.style = Object.assign(UtilTools.deepClone(defaultStyle), style);
    this.shapeActionLimit = board.actionStoreLimit;
    if (minRect instanceof Rect) {
      this.coveredRect = minRect;
    } else {
      this.coveredRect = new Rect(minRect);
    }
    this.bindingBox = UtilTools.minRectToPath(this.coveredRect);
    // delete
    this.minRect = this.coveredRect.rectPoint;
  }

  /**
   * @deprecated
   *
   * 移除function
   */
  moveStart(v: Vec2) {}
  /**
   * @deprecated
   *
   * 使用 transfer 替代
   */
  move(v: Vec2) {}
  /**
   * @deprecated
   *
   * 使用 transferEnd 替代
   *
   */
  moveEnd(v: Vec2) {}

  transfer(v: Vec2, matrix: DOMMatrix): void {
    // updata shape path  & rerender event layer
    const s = this.style,
      newPath = new Path2D();
    newPath.addPath(this.path, matrix);
    this.board.rerenderToEvent({ bs: { p: newPath, s } });
  }

  transferEnd(v: Vec2, matrix: DOMMatrix, type: ShapeActionType): void {
    // updata shape path  & rerender event layer
    const s = this.style,
      newPath = new Path2D();
    newPath.addPath(this.path, matrix);
    this.path = newPath;
    this.board.rerenderToEvent({ bs: { p: this.path, s } });
    switch (type) {
      case "translate":
        this.coveredRect.translateSelf(matrix);
        break;
      case "rotate":
        this.coveredRect.rotateSelf(matrix);
        break;
      case "ne-scale":
      case "nw-scale":
      case "se-scale":
      case "sw-scale":
        this.coveredRect.scaleSelf(matrix);
        break;
    }

    const newBindingBox = new Path2D();
    newBindingBox.addPath(this.bindingBox, matrix);
    this.bindingBox = newBindingBox;
    this.logAction(type, matrix.inverse());
  }

  undo() {}
  redo() {}

  logAction(type: ShapeActionType, matrix: DOMMatrix) {
    this.shapeActionLog.push({ type, matrix });

    if (this.shapeActionLog.length > this.shapeActionLimit) {
      const [remove, ...keep] = this.shapeActionLog;
      this.shapeActionLog = keep;
    }
  }
}
