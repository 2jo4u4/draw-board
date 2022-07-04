import { Board, defaultStyle, UtilTools, Rect } from "..";

interface ShapeAction {
  type: ShapeActionType;
  matrix: DOMMatrix;
}

const defWillDeleteStyle: Styles = {
  ...defaultStyle,
  lineColor: "red",
};
/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type;
  readonly id: string;
  readonly board: Board;

  private __style: Styles;
  get style() {
    if (this.__willDelete) {
      return defWillDeleteStyle;
    } else {
      return this.__style;
    }
  }
  set style(s: Styles) {
    this.__style = s;
  }

  private __path: Path2D;
  get path(): Path2D {
    return this.__path;
  }

  get pathWithMatrix(): Path2D {
    const p = new Path2D();
    p.addPath(this.__path, this.finallyMatrix);
    return p;
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
    return this.__coveredRect.clone().transferSelf(this.finallyMatrix);
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
    const p = new Path2D();
    p.addPath(this.__bindingBox, this.finallyMatrix);
    return p;
  }
  set bindingBox(p: Path2D) {
    this.__bindingBox = p;
  }

  /** 可否選取 */
  private __canSelect = true;
  get canSelect() {
    return this.__canSelect;
  }
  set canSelect(b: boolean) {
    this.__canSelect = b;
  }

  /** 是否被選取(選擇器使用) */
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
    this.__isDelete = b;
    this.__isSelect = false;
    this.__willDelete = false;
    this.__canSelect = !this.__isDelete;
  }

  /** 用於被擦子擦到的圖形 */
  private __willDelete = false;
  get willDelete() {
    return this.__willDelete;
  }
  set willDelete(b: boolean) {
    this.__willDelete = b;
  }

  protected __matrix: DOMMatrix;
  get matrix() {
    return this.__matrix;
  }
  set matrix(m: DOMMatrix) {
    this.__matrix = m;
  }
  protected stagingMatrix!: DOMMatrix;
  get finallyMatrix(): DOMMatrix {
    return DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(
      this.stagingMatrix
    );
  }
  /** 紀錄 */
  private shapeActionLog: ShapeAction[] = [];
  private shapeActionLimit: number;
  startPosition: Vec2 = { x: 0, y: 0 };
  regPosition: Vec2 = { x: 0, y: 0 };

  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles = defaultStyle,
    coveredRect: Rect = new Rect(),
    matrix?: DOMMatrix
  ) {
    this.$type = "base-shape";
    this.id = id;
    this.board = board;
    this.canSelect = true;
    this.__style = style;
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
    this.stagingMatrix = new DOMMatrix();
    this.__matrix = DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(m);
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
    const newRect = minRect.clone();
    this.coveredRect = newRect;
    this.bindingBox = UtilTools.minRectToPath(newRect);
  }
}
