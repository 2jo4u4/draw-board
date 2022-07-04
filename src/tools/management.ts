import type { Board, BaseShape, Styles, Vec2 } from "..";
import type { BaseTools } from "./base";
import { PencilTools } from "./pencil";
import { SelectTools } from "./select";
import { EarserTools } from "./earser";
import { ViewerTools } from "./viewer";

export enum ToolsEnum {
  "選擇器" = "select",
  "鉛筆" = "pencil",
  "圖形生成" = "shapeGenerate",
  "擦子" = "eraser",
  "文字框" = "textRect",
  "觀察者" = "viewer",
}

export enum LineWidth {
  "細" = 1,
  "一般" = 2,
  "粗" = 4,
}

/**
 * 控制插件
 */
export class ToolsManagement {
  readonly role: ManagerRole;
  pageid: string;
  private __toolsType!: ToolsEnum; // 建構時初始化
  get toolsType(): ToolsEnum {
    return this.__toolsType;
  }
  /** 板子實例 */
  readonly board: Board;
  /** 儲存當前選擇的工具 */
  private __usingTools!: BaseTools;
  get tools() {
    return this.__usingTools;
  }
  constructor(board: Board, role: ManagerRole = "self", pageid = "") {
    this.board = board;
    this.role = role;
    this.pageid = pageid;
    this.switchTypeToViewer(); // 設定初始工具
  }
  /** 觸摸/滑鼠下壓 */
  onEventStart(v: Vec2): void {
    this.__usingTools.onEventStart(v);
  }
  /** 手指/滑鼠 移動過程(下壓時的移動過程) */
  onEventMoveActive(v: Vec2): void {
    this.__usingTools.onEventMoveActive(v);
  }
  /** 手指/滑鼠 移動過程(非下壓時的移動過程) */
  onEventMoveInActive(v: Vec2): void {
    this.__usingTools.onEventMoveInActive(v);
  }
  /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
  onEventEnd(v: Vec2): void {
    this.__usingTools.onEventEnd(v);
  }

  changePencilStyle(s: Styles) {
    if (this.__usingTools instanceof PencilTools) {
      this.__usingTools.changeStyle(s);
    }
  }

  switchTypeTo(v: ToolsEnum): void {
    if (this.__toolsType !== v && this.board.canEdit) {
      this.__usingTools?.onDestroy();
      this.__toolsType = v;
      switch (v) {
        case ToolsEnum.選擇器:
          this.__usingTools = new SelectTools(this.board, this);
          break;
        case ToolsEnum.鉛筆:
          this.__usingTools = new PencilTools(this.board, this);
          break;
        case ToolsEnum.擦子:
          this.__usingTools = new EarserTools(this.board, this);
          break;
        case ToolsEnum.文字框:
          this.__usingTools = new SelectTools(this.board, this);
          break;
        case ToolsEnum.圖形生成:
          this.__usingTools = new SelectTools(this.board, this);
          break;
        case ToolsEnum.觀察者:
          this.__usingTools = new ViewerTools(this.board, this);
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

  switchTypeToViewer(): void {
    this.switchTypeTo(ToolsEnum.觀察者);
  }

  addBaaseShape(bs: BaseShape) {
    if (this.role === "self") {
      this.board.addShapeByBs(bs);
    } else if (this.board.socketCtrl) {
      this.board.socketCtrl.addBaseShape(this.pageid, bs);
    }
  }
  addToolsShape(bs: BaseShape) {
    if (this.role === "self") {
    } else if (this.board.socketCtrl) {
      this.board.socketCtrl.addToolsShape(this.pageid, bs);
    }
  }
  deleteShape(bss: BaseShape[]) {
    if (this.role === "self") {
      this.board.deleteShape(bss);
    } else if (this.board.socketCtrl) {
      this.board.socketCtrl.deleteBaseShape(this.pageid, bss);
    }
  }
}
