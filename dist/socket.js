"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMiddle = exports.UserAction = void 0;
var UserAction;
(function (UserAction) {
    UserAction["\u65B0\u589E"] = "add";
    UserAction["\u522A\u9664"] = "delete";
    UserAction["\u4FEE\u6539"] = "updata";
    UserAction["\u79FB\u52D5\u6ED1\u9F20"] = "moveMouse";
})(UserAction = exports.UserAction || (exports.UserAction = {}));
class SocketMiddle {
    postData(action) { }
    receviceData(v) { }
    dataToPath2D(v) {
        return new Path2D();
    }
}
exports.SocketMiddle = SocketMiddle;
//# sourceMappingURL=socket.js.map