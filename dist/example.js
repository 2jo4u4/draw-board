"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const canvas = document.createElement("canvas");
const tools = document.createElement("ul");
const p = document.createElement("p");
document.body.append(canvas, p, tools);
const board = new _1.Board(canvas);
initialTools();
function AddTools(v) {
    var _a;
    const child = document.createElement("li");
    const text = ((_a = Object.entries(_1.ToolsEnum).find(([key, val]) => val === v)) === null || _a === void 0 ? void 0 : _a[0]) ||
        "未定義工具";
    child.innerText = text;
    child.addEventListener("click", () => {
        p.innerText = `目前工具：${text}`;
        board.toolsCtrl.switchTypeTo(v);
    });
    tools.appendChild(child);
}
function initialTools() {
    tools.style.cursor = "pointer";
    board.toolsCtrl.switchTypeToPencil();
    p.innerText = `目前工具：鉛筆`;
    AddTools(_1.ToolsEnum.鉛筆);
    AddTools(_1.ToolsEnum.選擇器);
}
//# sourceMappingURL=example.js.map