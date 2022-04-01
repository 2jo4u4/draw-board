"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const canvasId = "myCanvas";
const toolsId = "myTools";
const tipId = "status";
const canvas = document.getElementById(canvasId);
const tools = document.getElementById(toolsId);
const tipText = document.getElementById(tipId);
if (canvas && tools) {
    const board = new _1.Board(canvas);
    board.toolsCtrl.switchTypeToPencil();
    if (tipText) {
        tipText.innerText = `預設狀態: 鉛筆`;
    }
    for (const index in tools.children) {
        const element = tools.children[index];
        if (element) {
            const type = element.id === "" ? null : element.id;
            if (type) {
                element.addEventListener("click", () => {
                    board.toolsCtrl.switchTypeTo(type);
                    if (tipText) {
                        tipText.innerText = `已選擇:${element.innerText}`;
                    }
                });
            }
        }
    }
}
