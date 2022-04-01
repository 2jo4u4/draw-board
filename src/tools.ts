import { Board, Styles, defaultStyle, Vec2, MinRectVec, UtilTools } from ".";

export enum ToolsEnum {
  "選擇器" = "select",
  "鉛筆" = "pencil",
  "圖形生成" = "shapeGenerate",
  "擦子" = "eraser",
  "文字框" = "textRect",
}

export enum LineWidth {
  "細" = 1,
  "一般" = 2,
  "粗" = 4,
}

/**
 * 沒選中 / 選中多個 / 選中單個
 */
type SelectFlag = "none" | "multiple" | "single";

/**
 * 控制插件
 */
export class ToolsManagement {
  private __toolsType!: ToolsEnum; // 建構時初始化
  get toolsType(): ToolsEnum {
    return this.__toolsType;
  }
  /** 板子實例 */
  private board: Board;
  private usingTools!: BaseTools;
  constructor(board: Board) {
    this.board = board;
    this.switchTypeToSelect(); // 設定初始工具
  }
  /** 觸摸/滑鼠下壓 */
  onEventStart(v: Vec2): void {
    this.usingTools.onEventStart(v);
  }
  /** 手指/滑鼠 移動過程 */
  onEventMove(v: Vec2): void {
    this.usingTools.onEventMove(v);
  }
  /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
  onEventEnd(v: Vec2): void {
    this.usingTools.onEventEnd(v);
  }

  changePencilStyle(s: Styles) {
    if (this.usingTools instanceof PencilTools) {
      this.usingTools.changeStyle(s);
    }
  }

  switchTypeTo(v: ToolsEnum): void {
    this.__toolsType = v;
    switch (v) {
      case ToolsEnum.選擇器:
        this.usingTools = new SelectTools(this.board);
        break;
      case ToolsEnum.鉛筆:
        this.usingTools = new PencilTools(this.board);
        break;
      case ToolsEnum.擦子:
        this.usingTools = new SelectTools(this.board);
        break;
      case ToolsEnum.文字框:
        this.usingTools = new SelectTools(this.board);
        break;
      case ToolsEnum.圖形生成:
        this.usingTools = new SelectTools(this.board);
        break;
      default:
        break;
    }
  }

  switchTypeToSelect(): void {
    this.switchTypeTo(ToolsEnum.選擇器);
  }

  switchTypeToPencil(): void {
    this.switchTypeTo(ToolsEnum.鉛筆);
  }

  switchTypeToShapeGenerate(): void {
    this.switchTypeTo(ToolsEnum.圖形生成);
  }

  switchTypeToTextRect(): void {
    this.switchTypeTo(ToolsEnum.文字框);
  }

  switchTypeToEraser(): void {
    this.switchTypeTo(ToolsEnum.擦子);
  }
}

abstract class BaseTools {
  onEventStart(v: Vec2): void {}
  onEventMove(v: Vec2): void {}
  onEventEnd(v: Vec2): void {}
}

/** 選擇器 */
class SelectTools implements BaseTools {
  private board: Board;
  /** 選取狀態旗標 */
  private selectFlag!: SelectFlag;
  /** 選取前的畫面 */
  private beforeSelectScreen: ImageData | null = null;
  /** 滑鼠起點 */
  private startPosition: Vec2 = { x: 0, y: 0 };
  constructor(board: Board) {
    const { width, height } = board.canvas;
    this.board = board;
    this.beforeSelectScreen = board.ctx.getImageData(0, 0, width, height);
    this.selectFlag = "none";
  }

  onEventStart(v: Vec2): void {
    this.startPosition = v;
  }
  onEventMove(v: Vec2): void {
    switch (this.selectFlag) {
      case "none":
        (() => {
          const { x, y } = this.startPosition;
          const { x: nX, y: nY } = v;
          this.board.ctx.putImageData(
            this.beforeSelectScreen as ImageData,
            0,
            0
          );
          this.board.ctx.strokeRect(x, y, nX - x, nY - y);
        })();
        break;
      case "multiple":
        break;
      case "single":
        break;
      default:
        break;
    }
  }
  onEventEnd(v: Vec2): void {
    if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
      // 點擊
      const shape = Array.from(this.board.shapes)
        .reverse()
        .find((item) => item[1].isSelected(v));
      if (shape) {
        shape[1].openSelectRect();
      }
    } else {
      // 移動
      this.board.ctx.putImageData(this.beforeSelectScreen as ImageData, 0, 0);
    }
  }
}

/** 鉛筆 */
class PencilTools implements BaseTools {
  private board: Board;
  private drawStyle: Styles = defaultStyle;
  private minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  private path!: Path2D;
  constructor(board: Board) {
    this.board = board;
  }

  changeStyle(s: Styles): void {
    this.drawStyle = s;
  }
  onEventStart(v: Vec2): void {
    this.minRect = { leftTop: v, rightBottom: v };
    this.path = new Path2D();
    this.board.ctx.strokeStyle = this.drawStyle.lineColor;
    this.board.ctx.lineWidth = this.drawStyle.lineWidth;
    this.path.moveTo(v.x - 1, v.y - 1);
    this.path.lineTo(v.x, v.y);
    this.board.ctx.stroke(this.path);
  }
  onEventMove(v: Vec2): void {
    this.path.lineTo(v.x, v.y);
    this.board.ctx.stroke(this.path);
    this.minRect = UtilTools.newMinRect(v, this.minRect);
  }
  onEventEnd(v: Vec2): void {
    this.path.lineTo(v.x, v.y);
    this.board.ctx.stroke(this.path);
    this.board.addShape(
      this.path,
      this.drawStyle,
      UtilTools.newMinRect(v, this.minRect)
    );
  }
}
