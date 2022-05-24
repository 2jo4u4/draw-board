export declare enum UserAction {
    "新增" = "add",
    "刪除" = "delete",
    "修改" = "updata",
    "移動滑鼠" = "moveMouse"
}
export declare abstract class SocketMiddle {
    postData(action: UserAction): void;
    receviceData(v: unknown): void;
    dataToPath2D(v: unknown): Path2D;
}
