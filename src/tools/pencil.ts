import type { ToolsManagement } from ".";
import type { Board, BaseTools, Styles, Vec2, MinRectVec } from "..";
import { defaultStyle, Rect, UtilTools, UserAction, BaseShape } from "..";

/** 鉛筆 */
export class PencilTools implements BaseTools {
  /** 繪製到 canvas 上 及 設定畫筆 */
  readonly board: Board;
  readonly manager: ToolsManagement;

  private drawStyle: Styles;
  /** 能包覆此圖形的最小矩形 */
  private minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  shape!: BaseShape;
  private path!: Path2D;
  /** 圖形路徑 */
  constructor(
    board: Board,
    manager: ToolsManagement,
    drawStyle = defaultStyle
  ) {
    this.board = board;
    this.manager = manager;
    this.drawStyle = drawStyle;
    board.changeCursor("pencil");
  }

  onDestroy(): void {
    this.board.changeCursor("default");
  }

  changeStyle(s: Styles): void {
    this.drawStyle = s;
  }

  onEventStart(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.minRect = { leftTop: { x, y }, rightBottom: { x, y } };
    this.path = UtilTools.minRectToPath(this.minRect);
    const path = new Path2D();
    path.arc(x, y, this.drawStyle.lineWidth / 2, 0, Math.PI * 2);
    this.shape = new BaseShape(
      UtilTools.RandomID(),
      this.board,
      path,
      { ...this.drawStyle, fillColor: this.drawStyle.lineColor },
      new Rect(this.minRect)
    );
    this.manager.addBaaseShape(this.shape);
    this.manager.sendEvent({
      type: UserAction["筆(開始)"],
      v,
      bss: [this.shape],
    });
  }

  onEventMoveActive(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.minRect = UtilTools.newMinRect({ x, y }, this.minRect);
    this.path.lineTo(x, y);
    this.shape.reInit(this.path, new Rect(this.minRect));
    this.shape.style = this.drawStyle;
    this.manager.sendEvent({
      type: UserAction["筆(移動)"],
      v,
      bss: [this.shape],
    });
  }

  onEventMoveInActive(v: Vec2): void {
    // nothing
  }

  onEventEnd(v: Vec2): void {
    const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
    this.minRect = UtilTools.newMinRect({ x, y }, this.minRect);
    const p = new Path2D(this.shape.path);
    p.lineTo(x, y);
    this.shape.reInit(p, new Rect(this.minRect));
    this.manager.sendEvent({
      type: UserAction["筆(結束)"],
      v,
      bss: [this.shape],
    });
  }
}
