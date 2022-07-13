import type { Styles, Vec2, MinRectVec } from "..";
import { Board, defaultStyle, UtilTools, Rect } from "..";

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
      return { ...this.__style, lineColor: "red" };
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
  get bindingBox(): Path2D {
    return UtilTools.minRectToPath(this.coveredRect);
  }
  get bindingBoxWithMatrix(): Path2D {
    return UtilTools.minRectToPath(this.coveredRectWithmatrix);
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
  startPosition: Vec2 = { x: 0, y: 0 };
  regPosition: Vec2 = { x: 0, y: 0 };

  get ctxContent() {
    return this.isSelect ? this.board.ctx : this.board.ctxStatic;
  }

  get zoomMatrix() {
    return this.board.refZoomMatrix;
  }

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
    this.__matrix = DOMMatrix.fromMatrix(matrix);
    this.__path = new Path2D(path);
    this.__coveredRect = coveredRect.clone();
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
      const ctx = this.ctxContent;
      UtilTools.injectStyle(ctx, this.style);
      ctx.setTransform(this.zoomMatrix);
      if (this.style.fillColor) {
        ctx.fill(this.pathWithMatrix);
      } else {
        ctx.stroke(this.pathWithMatrix);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  reInit(path: Path2D, minRect: Rect) {
    this.__path = new Path2D(path);
    const newRect = minRect.clone();
    this.coveredRect = newRect;
  }
}
