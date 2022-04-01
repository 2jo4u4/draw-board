"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectTools = void 0;
/** 選擇器 */
class SelectTools {
    constructor(board) {
        /** 選取前的畫面 */
        this.beforeSelectScreen = null;
        /** 滑鼠起點 */
        this.startPosition = { x: 0, y: 0 };
        const { width, height } = board.canvas;
        this.board = board;
        this.beforeSelectScreen = board.ctx.getImageData(0, 0, width, height);
        this.selectFlag = "none";
    }
    onEventStart(v) {
        this.startPosition = v;
    }
    onEventMove(v) {
        switch (this.selectFlag) {
            case "none":
                (() => {
                    const { x, y } = this.startPosition;
                    const { x: nX, y: nY } = v;
                    this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0);
                    this.board.ctx.strokeRect(x, y, nX - x, nY - y);
                })();
                break;
            case "multiple":
                break;
            case "single":
                break;
            default:
                break;
        }
    }
    onEventEnd(v) {
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
            // 點擊
            const shape = Array.from(this.board.shapes)
                .reverse()
                .find((item) => item[1].isSelected(v));
            if (shape) {
                shape[1].openSelectRect();
            }
        }
        else {
            // 移動
            this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0);
        }
    }
}
exports.SelectTools = SelectTools;
