"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PencilTools = void 0;
var __1 = require("..");
var PencilTools = (function () {
    function PencilTools(board, drawStyle) {
        if (drawStyle === void 0) { drawStyle = __1.defaultStyle; }
        this.minRect = {
            leftTop: { x: 0, y: 0 },
            rightBottom: { x: 0, y: 0 },
        };
        this.board = board;
        this.drawStyle = drawStyle;
    }
    PencilTools.prototype.onDestroy = function () { };
    PencilTools.prototype.changeStyle = function (s) {
        this.drawStyle = s;
    };
    PencilTools.prototype.onEventStart = function (v) {
        this.settingPen();
        this.minRect = { leftTop: v, rightBottom: v };
        this.path = new Path2D();
        this.path.moveTo(v.x - 1, v.y - 1);
        this.path.lineTo(v.x, v.y);
        this.draw();
    };
    PencilTools.prototype.onEventMoveActive = function (v) {
        this.path.lineTo(v.x, v.y);
        this.draw();
        this.minRect = __1.UtilTools.newMinRect(v, this.minRect);
    };
    PencilTools.prototype.onEventMoveInActive = function (v) {
    };
    PencilTools.prototype.onEventEnd = function (v) {
        this.path.lineTo(v.x, v.y);
        this.draw();
        this.addToBoard(v);
        this.drawOver();
    };
    PencilTools.prototype.settingPen = function () {
        __1.UtilTools.injectStyle(this.board.ctx, this.drawStyle);
    };
    PencilTools.prototype.draw = function () {
        this.board.ctx.stroke(this.path);
    };
    PencilTools.prototype.addToBoard = function (v) {
        this.board.addShape(this.path, this.drawStyle, __1.UtilTools.newMinRect(v, this.minRect));
    };
    PencilTools.prototype.drawOver = function () {
        this.board.clearCanvas("event");
    };
    return PencilTools;
}());
exports.PencilTools = PencilTools;
