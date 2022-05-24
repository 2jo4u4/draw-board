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
var SocketMiddle = (function () {
    function SocketMiddle() {
    }
    SocketMiddle.prototype.postData = function (action) { };
    SocketMiddle.prototype.receviceData = function (v) { };
    SocketMiddle.prototype.dataToPath2D = function (v) {
        return new Path2D();
    };
    return SocketMiddle;
}());
exports.SocketMiddle = SocketMiddle;
