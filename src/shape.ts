import { Board, Vec2 } from ".";

export interface MinRectVec {
  leftTop: Vec2;
  rightBottom: Vec2;
}
export interface Styles {
  lineColor: string;
  lineWidth: number;
  fillColor?: string;
}

export const defaultStyle: Styles = {
  lineColor: "#000",
  lineWidth: 2,
  fillColor: undefined,
};
const padding = 8; // px
/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type = "base-shape";
  readonly id: string;
  path: Path2D;
  board: Board;
  style: Styles;
  /** 紀錄一個路徑的最小包覆矩形 */
  minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  /** 被選擇時的外框 */
  selectRectPath: Path2D;
  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles,
    minRect: MinRectVec
  ) {
    this.id = id;
    this.board = board;
    this.path = new Path2D(path);
    this.style = Object.assign(defaultStyle, style);
    this.minRect = minRect;
    const {
      leftTop: { x: sX, y: sY },
      rightBottom: { x: eX, y: eY },
    } = minRect;
    this.selectRectPath = new Path2D();
    this.selectRectPath.rect(
      sX - padding,
      sY - padding,
      eX - sX + padding * 2,
      eY - sY + padding * 2
    );
  }

  isSelected(v: Vec2): Boolean {
    return this.board.ctx.isPointInPath(this.selectRectPath, v.x, v.y);
  }

  openSelectRect() {
    this.board.updata(this.selectRectPath);
  }
}
