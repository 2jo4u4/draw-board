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
    let p = new Path2D();
    p.addPath(this.__path, this.matrix);
    this.SRTMatrix.forEach((m) => {
      const np = new Path2D();
      np.addPath(p, m);
      p = np;
    });
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
    return this.__coveredRect.clone().transferSelf(this.matrix);
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
    let p = new Path2D();
    p.addPath(this.__bindingBox, this.matrix);
    this.SRTMatrix.forEach((m) => {
      const np = new Path2D();
      np.addPath(p, m);
      p = np;
    });
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
    if (!this.__isSelect) {
      const m = new DOMMatrix();
      this.SRTMatrix.forEach((m) => {
        m.multiplySelf(m);
      });

      this.__matrix = DOMMatrix.fromMatrix(this.__matrix)
        .inverse()
        .multiplySelf(m);
    }
    this.resetSRTMatrix();
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
  private shapeActionLog: ShapeAction[] = [];
  private shapeActionLimit: number;
  startPosition!: Vec2;
  regPosition!: Vec2;

  /** 一次選取後的所有動作紀錄 */
  private SRTMatrix: DOMMatrix[] = [];

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
    this.__path = path;
    this.__coveredRect = coveredRect.clone();
    this.__bindingBox = UtilTools.minRectToPath(coveredRect);
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

  transferStart(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {
    this.regPosition = v;
    this.startPosition = v;
  }

  transfer(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {
    // this.conputerMatrix(v, type);
    // this.regPosition = v;
  }

  transferEnd(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {}

  conputerMatrix(v: Vec2, flag: ShapeActionType | null): DOMMatrix {
    const [s, r, t] = this.SRTMatrix;
    switch (flag) {
      case "translate":
        t.multiplySelf(UtilTools.translate(this.regPosition, v));
        break;
      case "rotate":
        r.multiplySelf(
          UtilTools.rotate(
            this.coveredRectWithmatrix.centerPoint,
            v,
            UtilTools.getDegree(
              UtilTools.getAngle(
                this.coveredRectWithmatrix.centerPoint,
                this.regPosition
              )
            )
          )
        );
        break;
      case "nw-scale":
        s.multiplySelf(
          UtilTools.scale(
            v,
            this.regPosition,
            this.coveredRectWithmatrix.getReferPointOpposite(flag)
          )
        );
        break;
      case "ne-scale":
        s.multiplySelf(
          UtilTools.scale(
            { x: this.regPosition.x, y: v.y },
            { x: v.x, y: this.regPosition.y },
            this.coveredRectWithmatrix.getReferPointOpposite(flag)
          )
        );
        break;
      case "sw-scale":
        s.multiplySelf(
          UtilTools.scale(
            { x: v.x, y: this.regPosition.y },
            { x: this.regPosition.x, y: v.y },
            this.coveredRectWithmatrix.getReferPointOpposite(flag)
          )
        );
        break;
      case "se-scale":
        s.multiplySelf(
          UtilTools.scale(
            this.regPosition,
            v,
            this.coveredRectWithmatrix.getReferPointOpposite(flag)
          )
        );
        break;
    }
    return DOMMatrix.fromMatrix(s).multiplySelf(r).multiplySelf(t);
  }

  updata(t: number) {
    if (!this.isDelete) {
      this.board.renderBaseShape(this);
    }
  }

  resetSRTMatrix() {
    this.SRTMatrix = [new DOMMatrix(), new DOMMatrix(), new DOMMatrix()];
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
