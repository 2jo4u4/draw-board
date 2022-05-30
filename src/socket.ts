import { BaseShape, Board, BoardShapeLog } from ".";

type PageData = Map<string, BoardShapeLog>;
/** 使用者行為 */
export enum UserAction {
  "新增" = "add",
  "刪除" = "delete",
  "修改" = "updata",
  "移動滑鼠" = "moveMouse",
  "畫圖" = "draw",
  "換頁" = "changePage",
}

/**
 * 網路插件
 */
export abstract class SocketMiddle {
  /** 傳送資料 */
  abstract postData(action: UserAction): void;
  /** 接收資料 */
  abstract receviceData(v: unknown): void;
  /** 轉換成圖形類別 */
  abstract dataToPath2D(v: unknown): BaseShape;
}

export class DemoSocket implements SocketMiddle {
  readonly socket: WebSocket;
  readonly board: Board;

  isReady = false;
  pageId!: string;
  pageData: PageData = new Map<string, BoardShapeLog>();

  constructor(url: string, canvas: HTMLCanvasElement) {
    this.socket = new WebSocket(url);
    this.board = new Board(canvas, { Socket: this });
  }
  postData(action: UserAction): void {
    throw new Error("Method not implemented.");
  }
  receviceData(v: unknown): void {
    // const newPageData = this.pageData.get("")
    // newPageData && this.board.changePage(newPageData)
    throw new Error("Method not implemented.");
  }
  dataToPath2D(v: unknown): BaseShape {
    throw new Error("Method not implemented.");
  }
}
