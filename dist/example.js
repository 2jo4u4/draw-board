"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var canvas = document.createElement("canvas");
var tools = document.createElement("ul");
var p = document.createElement("p");
document.body.append(canvas, p, tools);
var board = new _1.Board(canvas);
initialTools();
function AddTools(v) {
    var _a;
    var child = document.createElement("li");
    var text = ((_a = Object.entries(_1.ToolsEnum).find(function (_a) {
        var key = _a[0], val = _a[1];
        return val === v;
    })) === null || _a === void 0 ? void 0 : _a[0]) ||
        "未定義工具";
    child.innerText = text;
    child.addEventListener("click", function () {
        p.innerText = "\u76EE\u524D\u5DE5\u5177\uFF1A".concat(text);
        board.toolsCtrl.switchTypeTo(v);
    });
    tools.appendChild(child);
}
function initialTools() {
    tools.style.cursor = "pointer";
    board.toolsCtrl.switchTypeToPencil();
    p.innerText = "\u76EE\u524D\u5DE5\u5177\uFF1A\u925B\u7B46";
    AddTools(_1.ToolsEnum.鉛筆);
    AddTools(_1.ToolsEnum.選擇器);
}
