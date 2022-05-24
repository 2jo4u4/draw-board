"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseShape = void 0;
const __1 = require("..");
class BaseShape {
    constructor(id, board, path, style, minRect) {
        this.isSelect = false;
        this.$type = "base-shape";
        this.id = id;
        this.board = board;
        this.path = new Path2D(path);
        this.style = Object.assign(__1.UtilTools.deepClone(__1.defaultStyle), style);
        this.minRect = minRect;
        this.bindingBox = __1.UtilTools.minRectToPath(minRect, __1.padding);
    }
    moveStart(v) {
        this.regPosition = v;
        this.startPosition = v;
        __1.UtilTools.injectStyle(this.board.ctx, this.style);
        this.board.ctx.stroke(this.path);
    }
    move(v) {
        const offset = this.getOffset(this.regPosition, v), newPath = new Path2D(), newSSRPath = new Path2D(), matrix = new DOMMatrix([1, 0, 0, 1, ...offset]);
        newPath.addPath(this.path, matrix);
        newSSRPath.addPath(this.bindingBox, matrix);
        this.path = newPath;
        this.bindingBox = newSSRPath;
        __1.UtilTools.injectStyle(this.board.ctx, this.style);
        this.board.ctx.stroke(this.path);
        this.regPosition = v;
    }
    moveEnd(v) {
        const offset = this.getOffset(this.regPosition, v), newPath = new Path2D(), matrix = new DOMMatrix([1, 0, 0, 1, ...offset]);
        newPath.addPath(this.path, matrix);
        this.path = newPath;
        this.updataMinRect(v);
    }
    getOffset(prev, next) {
        return [next.x - prev.x, next.y - prev.y];
    }
    updataMinRect(v) {
        const [x, y] = this.getOffset(this.startPosition, v);
        const { leftTop: { x: oldX1, y: oldY1 }, rightBottom: { x: oldX2, y: oldY2 }, } = this.minRect;
        this.minRect = {
            leftTop: { x: oldX1 + x, y: oldY1 + y },
            rightBottom: { x: oldX2 + x, y: oldY2 + y },
        };
    }
}
exports.BaseShape = BaseShape;
//# sourceMappingURL=index.js.map