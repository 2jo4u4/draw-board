"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsManagement = exports.BaseTools = exports.LineWidth = exports.ToolsEnum = void 0;
var pencil_1 = require("./pencil");
var select_1 = require("./select");
var ToolsEnum;
(function (ToolsEnum) {
    ToolsEnum["\u9078\u64C7\u5668"] = "select";
    ToolsEnum["\u925B\u7B46"] = "pencil";
    ToolsEnum["\u5716\u5F62\u751F\u6210"] = "shapeGenerate";
    ToolsEnum["\u64E6\u5B50"] = "eraser";
    ToolsEnum["\u6587\u5B57\u6846"] = "textRect";
})(ToolsEnum = exports.ToolsEnum || (exports.ToolsEnum = {}));
var LineWidth;
(function (LineWidth) {
    LineWidth[LineWidth["\u7D30"] = 1] = "\u7D30";
    LineWidth[LineWidth["\u4E00\u822C"] = 2] = "\u4E00\u822C";
    LineWidth[LineWidth["\u7C97"] = 4] = "\u7C97";
})(LineWidth = exports.LineWidth || (exports.LineWidth = {}));
var BaseTools = (function () {
    function BaseTools(board) {
    }
    BaseTools.prototype.onEventStart = function (v) { };
    BaseTools.prototype.onEventMoveActive = function (v) { };
    BaseTools.prototype.onEventMoveInActive = function (v) { };
    BaseTools.prototype.onEventEnd = function (v) { };
    BaseTools.prototype.onDestroy = function () { };
    return BaseTools;
}());
exports.BaseTools = BaseTools;
var ToolsManagement = (function () {
    function ToolsManagement(board) {
        this.board = board;
        this.switchTypeToSelect();
    }
    Object.defineProperty(ToolsManagement.prototype, "toolsType", {
        get: function () {
            return this.__toolsType;
        },
        enumerable: false,
        configurable: true
    });
    ToolsManagement.prototype.onEventStart = function (v) {
        this.usingTools.onEventStart(v);
    };
    ToolsManagement.prototype.onEventMoveActive = function (v) {
        this.usingTools.onEventMoveActive(v);
    };
    ToolsManagement.prototype.onEventMoveInActive = function (v) {
        this.usingTools.onEventMoveInActive(v);
    };
    ToolsManagement.prototype.onEventEnd = function (v) {
        this.usingTools.onEventEnd(v);
    };
    ToolsManagement.prototype.changePencilStyle = function (s) {
        if (this.usingTools instanceof pencil_1.PencilTools) {
            this.usingTools.changeStyle(s);
        }
    };
    ToolsManagement.prototype.switchTypeTo = function (v) {
        var _a;
        if (this.__toolsType !== v) {
            (_a = this.usingTools) === null || _a === void 0 ? void 0 : _a.onDestroy();
            this.__toolsType = v;
            switch (v) {
                case ToolsEnum.選擇器:
                    this.usingTools = new select_1.SelectTools(this.board);
                    break;
                case ToolsEnum.鉛筆:
                    this.usingTools = new pencil_1.PencilTools(this.board);
                    break;
                case ToolsEnum.擦子:
                    this.usingTools = new select_1.SelectTools(this.board);
                    break;
                case ToolsEnum.文字框:
                    this.usingTools = new select_1.SelectTools(this.board);
                    break;
                case ToolsEnum.圖形生成:
                    this.usingTools = new select_1.SelectTools(this.board);
                    break;
                default:
                    break;
            }
        }
    };
    ToolsManagement.prototype.switchTypeToSelect = function () {
        this.switchTypeTo(ToolsEnum.選擇器);
    };
    ToolsManagement.prototype.switchTypeToPencil = function () {
        this.switchTypeTo(ToolsEnum.鉛筆);
    };
    ToolsManagement.prototype.switchTypeToShapeGenerate = function () {
        this.switchTypeTo(ToolsEnum.圖形生成);
    };
    ToolsManagement.prototype.switchTypeToTextRect = function () {
        this.switchTypeTo(ToolsEnum.文字框);
    };
    ToolsManagement.prototype.switchTypeToEraser = function () {
        this.switchTypeTo(ToolsEnum.擦子);
    };
    return ToolsManagement;
}());
exports.ToolsManagement = ToolsManagement;
