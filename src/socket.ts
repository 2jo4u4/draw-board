/** 使用者行為 */
export enum UserAction {
  "新增" = "add",
  "刪除" = "delete",
  "修改" = "updata",
  "移動滑鼠" = "moveMouse",
}

/**
 * 網路插件
 */
export abstract class SocketMiddle {
  /** 傳送資料 */
  postData(action: UserAction) {}

  receviceData(v: unknown) {}

  dataToPath2D(v: unknown): Path2D {
    return new Path2D();
  }
}
