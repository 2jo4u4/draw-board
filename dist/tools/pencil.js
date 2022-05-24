"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PencilTools = void 0;
const __1 = require("..");
class PencilTools {
    constructor(board, drawStyle = __1.defaultStyle) {
        this.minRect = {
            leftTop: { x: 0, y: 0 },
            rightBottom: { x: 0, y: 0 },
        };
        this.board = board;
        this.drawStyle = drawStyle;
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
    onEventMoveInActive(v) {
    }
    onEventEnd(v) {
        this.path.lineTo(v.x, v.y);
        this.draw();
        this.addToBoard(v);
        this.drawOver();
    }
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
        this.board.clearCanvas("event");
    }
}
exports.PencilTools = PencilTools;
//# sourceMappingURL=pencil.js.map