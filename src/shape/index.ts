import { Board, defaultStyle, padding, UtilTools } from "..";

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
  /** 紀錄一個路徑的最小包覆矩形 */
  minRect: MinRectVec;
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

  /** 暫存移動座標 */
  regPosition!: Vec2;
  /** 暫存初始 */
  startPosition!: Vec2;
  /** 紀錄 */
  transferLogs: [] = [];

  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles,
    minRect: MinRectVec
  ) {
    this.$type = "base-shape";
    this.id = id;
    this.board = board;
    this.path = new Path2D(path);
    this.style = Object.assign(UtilTools.deepClone(defaultStyle), style);
    this.minRect = minRect;
    this.bindingBox = UtilTools.minRectToPath(minRect, padding);
  }

  moveStart(v: Vec2): void {
    this.regPosition = v;
    this.startPosition = v;
  }

  move(v: Vec2): void {
    const offset = this.getOffset(this.regPosition, v),
      s = this.style,
      newPath = new Path2D(),
      newSSRPath = new Path2D(),
      matrix = new DOMMatrix([1, 0, 0, 1, ...offset]);
    newPath.addPath(this.path, matrix);
    newSSRPath.addPath(this.bindingBox, matrix);
    this.board.rerenderToEvent({ bs: { p: newPath, s } });
    this.path = newPath;
    this.bindingBox = newSSRPath;
    this.regPosition = v;
  }

  moveEnd(v: Vec2): void {
    const offset = this.getOffset(this.regPosition, v),
      s = this.style,
      newPath = new Path2D(),
      newSSRPath = new Path2D(),
      matrix = new DOMMatrix([1, 0, 0, 1, ...offset]);
    newPath.addPath(this.path, matrix);
    newSSRPath.addPath(this.bindingBox, matrix);
    this.path = newPath;
    this.bindingBox = newSSRPath;
    this.board.rerenderToEvent({ bs: { p: newPath, s } });
    this.updataMinRect(v);
  }

  rotateStart(v: Vec2) {}
  rotate(v: Vec2) {}
  rotateEnd(v: Vec2) {}

  /** 取得偏移量(X,Y) */
  protected getOffset(prev: Vec2, next: Vec2): [number, number] {
    return [next.x - prev.x, next.y - prev.y];
  }

  /** 更新最小矩形座標 */
  private updataMinRect(v: Vec2): void {
    const [x, y] = this.getOffset(this.startPosition, v);
    const {
      leftTop: { x: oldX1, y: oldY1 },
      rightBottom: { x: oldX2, y: oldY2 },
    } = this.minRect;

    this.minRect = {
      leftTop: { x: oldX1 + x, y: oldY1 + y },
      rightBottom: { x: oldX2 + x, y: oldY2 + y },
    };
  }
}
