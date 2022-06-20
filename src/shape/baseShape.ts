import { Board, defaultStyle, UtilTools, Rect } from "..";

/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type;
  readonly id: string;
  readonly board: Board;
  readonly canSelect: boolean;
  style: Styles;

  private __path: Path2D;
  get path(): Path2D {
    return this.__path;
  }

  get pathWithMatrix(): Path2D {
    const p1 = new Path2D();
    p1.addPath(this.__path, this.matrix);
    const p2 = new Path2D();
    p2.addPath(p1, this.stagingMatrix);
    return p2;
  }
  set path(p: Path2D) {
    this.__path = p;
  }
  /** 紀錄一個路徑的最小包覆矩形 */
  private __coveredRect: Rect;
  get coveredRect(): Rect {
    return this.__coveredRect.clone();
  }
  get coveredRectWithmatrix(): Rect {
    return this.__coveredRect
      .clone()
      .transferSelf(this.matrix)
      .transferSelf(this.stagingMatrix);
  }
  set coveredRect(r: Rect) {
    this.__coveredRect = r;
  }
  get minRect(): MinRectVec {
    return this.coveredRect.rectPoint;
  }
  set minRect(v: MinRectVec) {}
  /** 判斷是否被選取的路徑 */
  private __bindingBox: Path2D;
  get bindingBox(): Path2D {
    return this.__bindingBox;
  }
  get bindingBoxWithMatrix(): Path2D {
    const p1 = new Path2D();
    p1.addPath(this.__bindingBox, this.matrix);
    const p2 = new Path2D();
    p2.addPath(p1, this.stagingMatrix);
    return p2;
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
    if (this.__isSelect) {
      this.stagingMatrix = new DOMMatrix();
    }
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
  private stagingMatrix!: DOMMatrix;
  /** 紀錄 */
  private shapeActionLog: ShapeAction[] = [];
  private shapeActionLimit: number;
  startPosition!: Vec2;
  regPosition!: Vec2;

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
    this.style = style;
    this.shapeActionLimit = board.actionStoreLimit;
    this.__matrix = DOMMatrix.fromMatrix(matrix);
    this.__path = new Path2D(path);
    this.__coveredRect = coveredRect.clone();
    this.__bindingBox = UtilTools.minRectToPath(coveredRect);
  }

  transferStart(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {
    this.regPosition = v;
    this.startPosition = v;
  }

  transfer(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {
    this.regPosition = v;
    this.stagingMatrix = m;
  }

  transferEnd(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {
    // merge matrix and stagingMatrix
    this.stagingMatrix = new DOMMatrix();
    this.matrix = DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(m);
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
