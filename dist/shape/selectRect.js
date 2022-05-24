"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectSolidRect = void 0;
var _1 = require(".");
var __1 = require("..");
var trash_bin_svgrepo_com_svg_1 = __importDefault(require("../assets/trash-bin-svgrepo-com.svg"));
var redo_svgrepo_com_svg_1 = __importDefault(require("../assets/redo-svgrepo-com.svg"));
var defaultSolidboxStyle = {
    lineWidth: 2,
    lineColor: "#00000080",
    lineDash: __1.dashedLine,
    fillColor: undefined,
};
var SelectSolidRect = (function (_super) {
    __extends(SelectSolidRect, _super);
    function SelectSolidRect(board) {
        var _this = _super.call(this, "selectRect_onlyOne", board, new Path2D(), defaultSolidboxStyle, {
            rightBottom: { x: 0, y: 0 },
            leftTop: { x: 0, y: 0 },
        }) || this;
        _this.shapes = [];
        _this.$type = "selectSolid-shape";
        _this.actionBar = new ActionBar(board, _this, ["delete"]);
        return _this;
    }
    SelectSolidRect.prototype.settingAndOpen = function (mrv) {
        var bsArray = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            bsArray[_i - 1] = arguments[_i];
        }
        this.setting.apply(this, __spreadArray([mrv], bsArray, false));
        this.draw();
        this.openSolidRect(mrv);
    };
    SelectSolidRect.prototype.setting = function (mrv) {
        var bsArray = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            bsArray[_i - 1] = arguments[_i];
        }
        this.minRect = mrv;
        this.settingPath(__1.UtilTools.minRectToPath(mrv, __1.padding));
        this.shapes = bsArray;
    };
    SelectSolidRect.prototype.openSolidRect = function (mrv) {
        this.settingCtx();
        this.actionBar.openBar(mrv);
    };
    SelectSolidRect.prototype.closeSolidRect = function () {
        this.actionBar.closeBar();
        this.settingPath();
    };
    SelectSolidRect.prototype.moveStart = function (v) {
        var _this = this;
        this.board.clearCanvas();
        this.board.shapes.forEach(function (bs) {
            if (bs.isSelect) {
                bs.moveStart(v);
            }
            else {
                __1.UtilTools.injectStyle(_this.board.ctx, bs.style);
                _this.board.ctxStatic.stroke(bs.path);
            }
        });
        this.draw();
        _super.prototype.moveStart.call(this, v);
    };
    SelectSolidRect.prototype.move = function (v) {
        this.board.clearCanvas("event");
        this.shapes.forEach(function (bs) {
            bs.move(v);
        });
        this.actionBar.move(this.getOffset(this.regPosition, v));
        _super.prototype.move.call(this, v);
        this.draw();
    };
    SelectSolidRect.prototype.moveEnd = function (v) {
        var _this = this;
        this.board.clearCanvas();
        this.shapes.forEach(function (bs) {
            bs.moveEnd(v);
        });
        _super.prototype.moveEnd.call(this, v);
        this.board.shapes.forEach(function (bs) {
            _this.board.drawByBs(bs);
        });
        this.draw();
    };
    SelectSolidRect.prototype.draw = function () {
        __1.UtilTools.injectStyle(this.board.ctx, this.style);
        this.board.ctx.stroke(this.bindingBox);
    };
    SelectSolidRect.prototype.settingPath = function (p) {
        if (p) {
            this.bindingBox = p;
        }
        else {
            var path = new Path2D();
            this.bindingBox = path;
        }
    };
    SelectSolidRect.prototype.settingCtx = function () {
        __1.UtilTools.injectStyle(this.board.ctx, defaultSolidboxStyle);
    };
    return SelectSolidRect;
}(_1.BaseShape));
exports.SelectSolidRect = SelectSolidRect;
var interval = 60;
var ActionBar = (function () {
    function ActionBar(board, bs, use) {
        this.openFlag = false;
        this.board = board;
        this.baseShape = bs;
        this.rootBlock = board.rootBlock;
        this.block = document.createElement("div");
        this.initial(use);
    }
    ActionBar.prototype.initial = function (use) {
        this.block.style.position = "absolute";
        this.block.style.border = "1px solid red";
        this.icon(use);
    };
    ActionBar.prototype.move = function (offset) {
        this.block.style.top = "".concat(parseInt(this.block.style.top) + offset[1], "px");
        this.block.style.left = "".concat(parseInt(this.block.style.left) + offset[0], "px");
    };
    ActionBar.prototype.openBar = function (mrv) {
        if (!this.openFlag) {
            this.openFlag = true;
            var _a = mrv || this.baseShape.minRect, _b = _a.leftTop, x1 = _b.x, y1 = _b.y, _c = _a.rightBottom, x2 = _c.x, y2 = _c.y;
            var width = x2 - x1 + __1.padding * 2 + defaultSolidboxStyle.lineWidth * 2;
            this.block.style.top = "".concat(y1 - interval, "px");
            this.block.style.left = "".concat(x1 - __1.padding - defaultSolidboxStyle.lineWidth, "px");
            this.block.style.width = "".concat(width, "px");
            this.rootBlock.append(this.block);
        }
    };
    ActionBar.prototype.closeBar = function () {
        if (this.openFlag) {
            this.openFlag = false;
            this.block.remove();
        }
    };
    ActionBar.prototype.icon = function (type) {
        var _this = this;
        type.forEach(function (item) {
            var btn;
            switch (item) {
                case "delete":
                    btn = _this.generateBtn(trash_bin_svgrepo_com_svg_1.default);
                    btn.onclick = function () {
                        _this.board.deleteShape();
                        _this.block.remove();
                    };
                    break;
                case "rotate":
                    btn = _this.generateBtn(redo_svgrepo_com_svg_1.default);
                    btn.onclick = function () {
                        console.log("rotate");
                    };
                    break;
            }
            _this.block.append(btn);
        });
    };
    ActionBar.prototype.generateBtn = function (src) {
        var img = new Image(24, 24);
        img.style.cursor = "pointer";
        img.src = src;
        return img;
    };
    return ActionBar;
}());
