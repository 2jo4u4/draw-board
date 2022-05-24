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
exports.SelectTools = void 0;
var selectRect_1 = require("./../shape/selectRect");
var __1 = require("..");
var defaultFlexboxStyle = {
    lineWidth: 2,
    lineColor: "#00000050",
    lineDash: __1.dashedLine,
};
var SelectTools = (function () {
    function SelectTools(board) {
        this.startPosition = { x: 0, y: 0 };
        this.board = board;
        this.selectFlag = "none";
        this.selectSolidRect = new selectRect_1.SelectSolidRect(board);
    }
    SelectTools.prototype.onDestroy = function () {
        this.board.clearCanvas("event");
        this.board.shapes.forEach(function (item) {
        });
    };
    SelectTools.prototype.onEventStart = function (v) {
        this.startPosition = v;
        if (this.board.ctx.isPointInPath(this.selectSolidRect.bindingBox, v.x, v.y)) {
            this.selectFlag = "selected";
            this.moveStart(v);
        }
        else {
            this.selectFlag = "none";
            this.selectStart(v);
        }
    };
    SelectTools.prototype.onEventMoveActive = function (v) {
        switch (this.selectFlag) {
            case "none":
                this.select(v);
                break;
            case "selected":
                this.move(v);
                break;
        }
    };
    SelectTools.prototype.onEventMoveInActive = function (v) {
        if (this.board.ctx.isPointInPath(this.selectSolidRect.bindingBox, v.x, v.y)) {
            this.board.rootBlock.style.cursor = "move";
        }
        else {
            this.board.rootBlock.style.cursor = "default";
        }
    };
    SelectTools.prototype.onEventEnd = function (v) {
        switch (this.selectFlag) {
            case "none":
                this.selectEnd(v);
                break;
            case "selected":
                this.moveEnd(v);
                break;
        }
    };
    SelectTools.prototype.selectStart = function (v) {
        this.selectSolidRect.closeSolidRect();
        this.board.shapes.forEach(function (bs) {
            bs.isSelect = false;
        });
        this.settingFlexBox();
    };
    SelectTools.prototype.select = function (v) {
        var _a = this.board.canvas, width = _a.width, height = _a.height, _b = this.startPosition, x = _b.x, y = _b.y, nX = v.x, nY = v.y;
        this.board.ctx.clearRect(0, 0, width, height);
        this.board.ctx.strokeRect(x, y, nX - x, nY - y);
    };
    SelectTools.prototype.selectEnd = function (v) {
        var _a;
        var _this = this;
        this.drawOverFlexBox();
        var minRectVec, shape = [];
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
            var single = Array.from(this.board.shapes)
                .reverse()
                .find(function (item) { return _this.isSelected(v, item[1]); });
            if (single) {
                shape = [single];
                minRectVec = single[1].minRect;
            }
        }
        else {
            var minRect_1 = __1.UtilTools.generateMinRect(v, this.startPosition);
            var regBS = Array.from(this.board.shapes).filter(function (item) {
                return _this.isSelected(minRect_1, item[1]);
            });
            if (regBS.length > 0) {
                shape = regBS;
                minRectVec = __1.UtilTools.mergeMinRect.apply(__1.UtilTools, regBS.map(function (bs) { return bs[1].minRect; }));
            }
        }
        if (shape[0]) {
            this.selectFlag = "selected";
            (_a = this.selectSolidRect).settingAndOpen.apply(_a, __spreadArray([minRectVec], shape.map(function (item) {
                item[1].isSelect = true;
                return item[1];
            }), false));
        }
        else {
            this.selectFlag = "none";
        }
    };
    SelectTools.prototype.moveStart = function (v) {
        this.selectSolidRect.moveStart(v);
    };
    SelectTools.prototype.move = function (v) {
        this.selectSolidRect.move(v);
    };
    SelectTools.prototype.moveEnd = function (v) {
        this.selectSolidRect.moveEnd(v);
    };
    SelectTools.prototype.isSelected = function (v, bs) {
        if (__1.UtilTools.isVec2(v)) {
            return this.board.ctx.isPointInPath(bs.bindingBox, v.x, v.y);
        }
        else {
            return this.isInRectBlock(v, bs);
        }
    };
    SelectTools.prototype.isInRectBlock = function (r, bs) {
        var _this = this;
        var _a = r.leftTop, selectx1 = _a.x, selecty1 = _a.y, _b = r.rightBottom, selectx2 = _b.x, selecty2 = _b.y;
        var _c = bs.minRect, _d = _c.leftTop, x1 = _d.x, y1 = _d.y, _e = _c.rightBottom, x2 = _e.x, y2 = _e.y;
        if (selectx1 <= x1 && selecty1 <= y1 && selectx2 >= x2 && selecty2 >= y2) {
            return true;
        }
        else if (x1 < selectx1 &&
            y1 < selecty1 &&
            x2 > selectx2 &&
            y2 > selecty2) {
            return true;
        }
        else if (selectx1 <= x1 &&
            selectx2 >= x2 &&
            ((selecty2 > y1 && selecty2 < y2) || (selecty1 > y1 && selecty1 < y2))) {
            return true;
        }
        else if (selecty1 <= y1 &&
            selecty2 >= y2 &&
            ((selectx2 > x1 && selectx2 < x2) || (selectx1 > x1 && selectx1 < x2))) {
            return true;
        }
        else {
            var foreCorner = [
                { x: selectx1, y: selecty1 },
                { x: selectx1, y: selecty2 },
                { x: selectx2, y: selecty1 },
                { x: selectx2, y: selecty2 },
            ];
            return Boolean(foreCorner.find(function (_a) {
                var x = _a.x, y = _a.y;
                return _this.board.ctx.isPointInPath(bs.bindingBox, x, y);
            }));
        }
    };
    SelectTools.prototype.settingFlexBox = function () {
        __1.UtilTools.injectStyle(this.board.ctx, defaultFlexboxStyle);
    };
    SelectTools.prototype.drawOverFlexBox = function () {
        this.board.clearCanvas("event");
    };
    return SelectTools;
}());
exports.SelectTools = SelectTools;
