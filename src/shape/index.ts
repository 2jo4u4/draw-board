import { Board, defaultStyle, UtilTools, Rect } from "..";

/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type;
  readonly id: string;
  readonly board: Board;
  /** 圖形路徑 */
  private __path: Path2D;
  get path(): Path2D {
    return this.__path;
  }

  get pathWithMatrix(): Path2D {
    const p = new Path2D();
    p.addPath(this.__path, this.matrix);
    return p;
  }

  set path(p: Path2D) {
    this.__path = p;
  }
  /** 樣式 */
  style: Styles;

  get minRect(): MinRectVec {
    return this.coveredRect.rectPoint;
  }

  set minRect(v: MinRectVec) {}

  /** 紀錄一個路徑的最小包覆矩形 */
  private __coveredRect: Rect;

  get coveredRect(): Rect {
    return this.__coveredRect.clone();
  }

  get coveredRectWithmatrix(): Rect {
    return this.__coveredRect.clone().transferSelf(this.matrix);
  }

  set coveredRect(r: Rect) {
    this.__coveredRect = r;
  }

  /** 判斷是否被選取的路徑 */
  private __bindingBox: Path2D;
  get bindingBox(): Path2D {
    return this.__bindingBox;
  }

  get bindingBoxWithMatrix(): Path2D {
    const p = new Path2D();
    p.addPath(this.__bindingBox, this.matrix);
    return p;
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

  readonly canSelect: boolean;

  /** 紀錄 */
  shapeActionLog: ShapeAction[] = [];
  shapeActionLimit: number;

  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles = defaultStyle,
    coveredRect: Rect,
    matrix?: DOMMatrix
  ) {
    this.$type = "base-shape";
    this.id = id;
    this.board = board;
    this.canSelect = true;
    this.__matrix = DOMMatrix.fromMatrix(matrix);
    this.__path = path;
    this.__coveredRect = coveredRect.clone();
    this.__bindingBox = UtilTools.minRectToPath(coveredRect);
    this.style = style;
    this.shapeActionLimit = board.actionStoreLimit;
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
    if (matrix instanceof DOMMatrix) {
      this.matrix.multiplySelf(matrix);
    } else {
      this.matrix.multiplySelf(matrix.m2);
    }
  }

  transferEnd(
    v: Vec2,
    matrix: DOMMatrix | MultiMatrix,
    type: ShapeActionType
  ): void {
    if (matrix instanceof DOMMatrix) {
      this.matrix.multiplySelf(matrix);
    } else {
      this.matrix.multiplySelf(matrix.m2);
    }

    this.logAction(type, DOMMatrix.fromMatrix(this.matrix).invertSelf());
  }

  updata(t: number) {
    if (!this.isDelete) {
      this.board.renderBaseShape(this);
    }
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

  reInit(path: Path2D, minRect: Rect) {
    this.__path = new Path2D(path);
    this.coveredRect = minRect.clone();
    this.bindingBox = UtilTools.minRectToPath(this.coveredRect);
  }
}
