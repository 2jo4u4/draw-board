/** 使用者行為 */
export declare enum UserAction {
    "新增" = "add",
    "刪除" = "delete",
    "修改" = "updata",
    "移動滑鼠" = "moveMouse"
}
/**
 * 網路插件
 */
export declare abstract class SocketMiddle {
    /** 傳送資料 */
    postData(action: UserAction): void;
    receviceData(v: unknown): void;
    dataToPath2D(v: unknown): Path2D;
}
