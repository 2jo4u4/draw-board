"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PencilTools = void 0;
const __1 = require("..");
/** 鉛筆 */
class PencilTools {
    constructor(board, drawStyle = __1.defaultStyle) {
        /** 能包覆此圖形的最小矩形 */
        this.minRect = {
            leftTop: { x: 0, y: 0 },
            rightBottom: { x: 0, y: 0 },
        };
        this.board = board;
        this.drawStyle = drawStyle;
    }
    onEventMoveInActive(v) {
        throw new Error("Method not implemented.");
    }
    onDestroy() { }
    changeStyle(s) {
        this.drawStyle = s;
    }
    onEventStart(v) {
        this.settingPen();
        this.minRect = { leftTop: v, rightBottom: v };
        this.path = new Path2D();
        this.path.moveTo(v.x - 1, v.y - 1);
        this.path.lineTo(v.x, v.y);
        this.draw();
    }
    onEventMoveActive(v) {
        this.path.lineTo(v.x, v.y);
        this.draw();
        this.minRect = __1.UtilTools.newMinRect(v, this.minRect);
    }
    onEventEnd(v) {
        this.path.lineTo(v.x, v.y);
        this.draw();
        this.addToBoard(v);
        this.drawOver();
    }
    // ----有使用到 board --------------------------
    settingPen() {
        __1.UtilTools.injectStyle(this.board.ctx, this.drawStyle);
    }
    draw() {
        this.board.ctx.stroke(this.path);
    }
    addToBoard(v) {
        this.board.addShape(this.path, this.drawStyle, __1.UtilTools.newMinRect(v, this.minRect));
    }
    drawOver() {
        const { width, height } = this.board.canvas;
        this.board.ctx.clearRect(0, 0, width, height);
    }
}
exports.PencilTools = PencilTools;
