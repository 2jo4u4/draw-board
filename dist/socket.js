"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMiddle = exports.UserAction = void 0;
/** 使用者行為 */
var UserAction;
(function (UserAction) {
    UserAction["\u65B0\u589E"] = "add";
    UserAction["\u522A\u9664"] = "delete";
    UserAction["\u4FEE\u6539"] = "updata";
    UserAction["\u79FB\u52D5\u6ED1\u9F20"] = "moveMouse";
})(UserAction = exports.UserAction || (exports.UserAction = {}));
/**
 * 網路插件
 */
class SocketMiddle {
    /** 傳送資料 */
    postData(action) { }
    receviceData(v) { }
    dataToPath2D(v) {
        return new Path2D();
    }
}
exports.SocketMiddle = SocketMiddle;
