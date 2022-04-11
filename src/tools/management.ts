import { Board } from "..";
import { PencilTools } from "./pencil";
import { SelectTools } from "./select";
import type { Styles, Vec2 } from "..";

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

export abstract class BaseTools {
  onEventStart(v: Vec2): void {}
  onEventMove(v: Vec2): void {}
  onEventEnd(v: Vec2): void {}
  onDestroy(): void {}
}

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
  /** 儲存當前選擇的工具 */
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
    if (this.__toolsType !== v) {
      this.usingTools?.onDestroy();
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
