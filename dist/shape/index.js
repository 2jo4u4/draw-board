"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseShape = void 0;
var __1 = require("..");
var BaseShape = (function () {
    function BaseShape(id, board, path, style, minRect) {
        this.isSelect = false;
        this.$type = "base-shape";
        this.id = id;
        this.board = board;
        this.path = new Path2D(path);
        this.style = Object.assign(__1.UtilTools.deepClone(__1.defaultStyle), style);
        this.minRect = minRect;
        this.bindingBox = __1.UtilTools.minRectToPath(minRect, __1.padding);
    }
    BaseShape.prototype.moveStart = function (v) {
        this.regPosition = v;
        this.startPosition = v;
        __1.UtilTools.injectStyle(this.board.ctx, this.style);
        this.board.ctx.stroke(this.path);
    };
    BaseShape.prototype.move = function (v) {
        var offset = this.getOffset(this.regPosition, v), newPath = new Path2D(), newSSRPath = new Path2D(), matrix = new DOMMatrix(__spreadArray([1, 0, 0, 1], offset, true));
        newPath.addPath(this.path, matrix);
        newSSRPath.addPath(this.bindingBox, matrix);
        this.path = newPath;
        this.bindingBox = newSSRPath;
        __1.UtilTools.injectStyle(this.board.ctx, this.style);
        this.board.ctx.stroke(this.path);
        this.regPosition = v;
    };
    BaseShape.prototype.moveEnd = function (v) {
        var offset = this.getOffset(this.regPosition, v), newPath = new Path2D(), matrix = new DOMMatrix(__spreadArray([1, 0, 0, 1], offset, true));
        newPath.addPath(this.path, matrix);
        this.path = newPath;
        this.updataMinRect(v);
    };
    BaseShape.prototype.getOffset = function (prev, next) {
        return [next.x - prev.x, next.y - prev.y];
    };
    BaseShape.prototype.updataMinRect = function (v) {
        var _a = this.getOffset(this.startPosition, v), x = _a[0], y = _a[1];
        var _b = this.minRect, _c = _b.leftTop, oldX1 = _c.x, oldY1 = _c.y, _d = _b.rightBottom, oldX2 = _d.x, oldY2 = _d.y;
        this.minRect = {
            leftTop: { x: oldX1 + x, y: oldY1 + y },
            rightBottom: { x: oldX2 + x, y: oldY2 + y },
        };
    };
    return BaseShape;
}());
exports.BaseShape = BaseShape;
