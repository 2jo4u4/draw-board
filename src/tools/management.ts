import { UtilTools, initialPageId, UserAction } from "..";
import type { SendData, Vec2, Board, BaseShape, Styles } from "..";
import type { BaseTools } from "./base";
import { PencilTools } from "./pencil";
import { SelectTools } from "./select";
import { EarserTools } from "./earser";
import { ViewerTools } from "./viewer";
import { LogStore } from "./logStore";

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
  readonly board: Board;
  pageid: string;
  readonly username: string;
  private __toolsType!: ToolsEnum; // 建構時初始化
  get toolsType(): ToolsEnum {
    return this.__toolsType;
  }
  private __usingTools!: BaseTools;
  get tools() {
    return this.__usingTools;
  }
  private __specifyNextShapeId: string | undefined = undefined;
  get specifyNextShapeId(): string {
    return this.__specifyNextShapeId || UtilTools.RandomID();
  }
  set specifyNextShapeId(id: string | undefined) {
    if (this.role !== "self") {
      this.__specifyNextShapeId = id;
    }
  }
  private logStores: Map<string, LogStore>;
  constructor(
    board: Board,
    role: ManagerRole = "self",
    pageid = initialPageId,
    username = "You"
  ) {
    this.board = board;
    this.role = role;
    this.pageid = pageid;
    this.username = username;
    this.switchTypeToViewer(); // 設定初始工具
    if (role === "self") {
      this.logStores = new Map([[pageid, new LogStore()]]);
    } else {
      this.logStores = new Map();
    }
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
    if (this.__toolsType !== v) {
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

  changePage(pageid: string) {
    const toolsType = this.__toolsType;
    this.switchTypeToViewer();
    this.pageid = pageid;
    this.switchTypeTo(toolsType);
    if (this.role === "self" && !this.logStores.has(pageid)) {
      this.logStores.set(pageid, new LogStore());
    }
  }
  addBaseShape(bs: BaseShape) {
    if (this.board.socketCtrl) {
      this.board.socketCtrl.addBaseShape(this.pageid, bs);
    } else if (this.role === "self") {
      this.board.addShapeByBs(bs);
    }
    if (this.role === "self") {
      this.logStores.get(this.pageid)?.log("addShape", { affectShape: [bs] });
    }
  }
  deleteBaseShape(bss: BaseShape[]) {
    if (this.board.socketCtrl) {
      this.board.socketCtrl.deleteBaseShape(this.pageid, bss);
    } else if (this.role === "self") {
      this.board.deleteShape(bss);
    }
    if (this.role === "self") {
      this.logStores.get(this.pageid)?.log("deleteShape", { affectShape: bss });
    }
  }
  clearAllPageShape() {
    if (this.board.socketCtrl && this.role !== "self") {
      this.board.socketCtrl.clearAllPageShape();
    } else if (this.role === "self") {
      const bss = Array.from(this.board.shapes)
        .filter(([id, bs]) => !bs.isDelete)
        .map(([id, bs]) => {
          bs.isDelete = true;
          return bs;
        });
      if (bss.length !== 0) {
        this.logStores
          .get(this.pageid)
          ?.log("deleteAllShape", { affectShape: bss });
      }
    }
  }
  addToolsShape(bs: BaseShape) {
    if (this.board.socketCtrl) {
      this.board.socketCtrl.addToolsShape(this.pageid, bs);
    } else if (this.role === "self") {
      this.board.addToolsShape(bs);
    }
  }
  removeToolsShape(bs: BaseShape) {
    if (this.board.socketCtrl) {
      this.board.socketCtrl.removeToolsShape(this.pageid, bs);
    } else if (this.role === "self") {
      this.board.removeToolsShape(bs);
    }
  }
  sendEvent(p: SendData) {
    if (this.role === "self" && this.board.socketCtrl) {
      this.board.socketCtrl.postData(p);
    }
  }

  undo() {
    if (this.role === "self") {
      const { type: logtype, bss } =
        this.logStores.get(this.pageid)?.undo() || {};
      if (logtype && bss) {
        let type: UserAction;
        switch (logtype) {
          case "addShape":
            type = UserAction["Undo/Redo(刪除圖形)"];
            break;
          case "deleteShape":
            type = UserAction["Undo/Redo(新增圖形)"];
            break;
          case "translateShape":
            type = UserAction["Undo/Redo(變形圖形)"];
            break;
          case "deleteAllShape":
            type = UserAction["Undo/Redo(新增整頁圖形)"];
            break;
        }

        this.sendEvent({ type, bss, v: { x: 0, y: 0 } });
      }
    }
  }
  redo() {
    if (this.role === "self") {
      const { type: logtype, bss } =
        this.logStores.get(this.pageid)?.redo() || {};
      if (logtype && bss) {
        let type: UserAction;
        switch (logtype) {
          case "addShape":
            type = UserAction["Undo/Redo(新增圖形)"];
            break;
          case "deleteShape":
            type = UserAction["Undo/Redo(刪除圖形)"];
            break;
          case "translateShape":
            type = UserAction["Undo/Redo(變形圖形)"];
            break;
          case "deleteAllShape":
            type = UserAction["Undo/Redo(刪除整頁圖形)"];
            break;
        }

        this.sendEvent({ type, bss, v: { x: 0, y: 0 } });
      }
    }
  }
}
