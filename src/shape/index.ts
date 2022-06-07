import { Board, defaultStyle, UtilTools, Rect } from "..";

/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type;
  readonly id: string;
  readonly board: Board;
  /** 圖形路徑 */
  __path: Path2D;
  get path(): Path2D {
    return this.__path;
  }
  set path(p: Path2D) {
    this.__path = p;
  }
  /** 樣式 */
  style: Styles;
  /**
   * @deprecated 用 coveredRect 代替
   *
   * 紀錄一個路徑的最小包覆矩形
   */
  minRect: MinRectVec;

  /** 紀錄一個路徑的最小包覆矩形 */
  private __coveredRect: Rect;

  get coveredRect(): Rect {
    return this.__coveredRect;
  }

  set coveredRect(r: Rect) {
    this.__coveredRect = r;
  }

  /** 判斷是否被選取的路徑 */
  private __bindingBox: Path2D;
  get bindingBox(): Path2D {
    return this.__bindingBox;
  }
  set bindingBox(p: Path2D) {
    this.__bindingBox = p;
  }

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

  private __matrix: DOMMatrix;
  get matrix() {
    return this.__matrix;
  }

  set matrix(m: DOMMatrix) {
    this.__matrix = m;
  }

  /** 紀錄 */
  shapeActionLog: ShapeAction[] = [];
  shapeActionLimit: number;

  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles,
    minRect: MinRectVec | Rect,
    matrix?: DOMMatrix
  ) {
    this.$type = "base-shape";
    this.id = id;
    this.board = board;
    this.__path = new Path2D(path);
    this.__matrix = DOMMatrix.fromMatrix(matrix);
    this.style = Object.assign(UtilTools.deepClone(defaultStyle), style);
    this.shapeActionLimit = board.actionStoreLimit;
    if (minRect instanceof Rect) {
      this.__coveredRect = minRect;
    } else {
      this.__coveredRect = new Rect(minRect);
    }
    this.__bindingBox = UtilTools.minRectToPath(this.coveredRect);
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

  transferStart(
    v: Vec2,
    matrix: DOMMatrix | MultiMatrix,
    type: ShapeActionType | null
  ): void {}

  transfer(
    v: Vec2,
    matrix: DOMMatrix | MultiMatrix,
    type: ShapeActionType
  ): void {
    // updata shape path  & rerender event layer
    const s = this.style,
      newPath = new Path2D();
    if (matrix instanceof DOMMatrix) {
      newPath.addPath(this.path, matrix);
    } else {
      newPath.addPath(this.path, matrix.m1);
    }
    this.board.rerenderToEvent({ bs: { p: newPath, s } });
  }

  transferEnd(
    v: Vec2,
    matrix: DOMMatrix | MultiMatrix,
    type: ShapeActionType
  ): void {
    // updata shape path  & rerender event layer
    const _m = (() => {
      if (matrix instanceof DOMMatrix) {
        return DOMMatrix.fromMatrix(matrix);
      } else {
        return DOMMatrix.fromMatrix(matrix.m1);
      }
    })();
    const s = this.style,
      newPath = new Path2D();
    newPath.addPath(this.path, _m);
    this.path = newPath;
    this.coveredRect.transferSelf(_m);
    this.board.rerenderToEvent({ bs: this });
    this.updataBindingBox(_m);
    this.logAction(type, _m.inverse());
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

  reInit(path: Path2D, minRect: MinRectVec | Rect) {
    this.__path = new Path2D(path);
    if (minRect instanceof Rect) {
      this.coveredRect = minRect.clone();
    } else {
      this.coveredRect = new Rect(minRect);
    }
    this.bindingBox = UtilTools.minRectToPath(this.coveredRect);
  }

  updataBindingBox(matrix: DOMMatrix) {
    const newBindingBox = new Path2D();
    newBindingBox.addPath(this.bindingBox, matrix);
    this.bindingBox = newBindingBox;
  }
}
