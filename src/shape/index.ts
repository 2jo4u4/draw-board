import { Board, defaultStyle, padding, UtilTools } from "..";

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

  /** 紀錄 */
  shapeActionLog: ShapeAction[] = [];
  shapeActionLimit: number;

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
    this.shapeActionLimit = board.actionStoreLimit;
  }

  move(v: Vec2, matrix: DOMMatrix): void {
    // updata shape path  & rerender event layer
    const s = this.style,
      newPath = new Path2D();
    newPath.addPath(this.path, matrix);
    this.board.rerenderToEvent({ bs: { p: newPath, s } });
  }

  moveEnd(
    dx: number,
    dy: number,
    matrix: DOMMatrix,
    type: ShapeActionType
  ): void {
    // updata shape path  & rerender event layer
    const s = this.style,
      newPath = new Path2D();
    newPath.addPath(this.path, matrix);
    this.path = newPath;
    this.board.rerenderToEvent({ bs: { p: this.path, s } });
    const {
      leftTop: { x: oldX1, y: oldY1 },
      rightBottom: { x: oldX2, y: oldY2 },
    } = this.minRect;

    switch (type) {
      case "translate":
        this.minRect = {
          leftTop: { x: oldX1 + dx, y: oldY1 + dy },
          rightBottom: { x: oldX2 + dx, y: oldY2 + dy },
        };
        break;
      case "rotate":
        break;
      case "scale":
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
