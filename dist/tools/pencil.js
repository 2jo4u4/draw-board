"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PencilTools = void 0;
const __1 = require("..");
/** 鉛筆 */
class PencilTools {
    constructor(board) {
        this.drawStyle = __1.defaultStyle;
        this.minRect = {
            leftTop: { x: 0, y: 0 },
            rightBottom: { x: 0, y: 0 },
        };
        this.board = board;
    }
    onDestroy() { }
    changeStyle(s) {
        this.drawStyle = s;
    }
    onEventStart(v) {
        this.minRect = { leftTop: v, rightBottom: v };
        this.path = new Path2D();
        this.board.ctx.strokeStyle = this.drawStyle.lineColor;
        this.board.ctx.lineWidth = this.drawStyle.lineWidth;
        this.path.moveTo(v.x - 1, v.y - 1);
        this.path.lineTo(v.x, v.y);
        this.board.ctx.stroke(this.path);
    }
    onEventMove(v) {
        this.path.lineTo(v.x, v.y);
        this.board.ctx.stroke(this.path);
        this.minRect = __1.UtilTools.newMinRect(v, this.minRect);
    }
    onEventEnd(v) {
        this.path.lineTo(v.x, v.y);
        this.board.ctx.stroke(this.path);
        this.board.addShape(this.path, this.drawStyle, __1.UtilTools.newMinRect(v, this.minRect));
    }
}
exports.PencilTools = PencilTools;
