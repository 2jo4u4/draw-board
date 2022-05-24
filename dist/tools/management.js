"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsManagement = exports.BaseTools = exports.LineWidth = exports.ToolsEnum = void 0;
const pencil_1 = require("./pencil");
const select_1 = require("./select");
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
class BaseTools {
    constructor(board) { }
    onEventStart(v) { }
    onEventMoveActive(v) { }
    onEventMoveInActive(v) { }
    onEventEnd(v) { }
    onDestroy() { }
}
exports.BaseTools = BaseTools;
class ToolsManagement {
    constructor(board) {
        this.board = board;
        this.switchTypeToSelect();
    }
    get toolsType() {
        return this.__toolsType;
    }
    onEventStart(v) {
        this.usingTools.onEventStart(v);
    }
    onEventMoveActive(v) {
        this.usingTools.onEventMoveActive(v);
    }
    onEventMoveInActive(v) {
        this.usingTools.onEventMoveInActive(v);
    }
    onEventEnd(v) {
        this.usingTools.onEventEnd(v);
    }
    changePencilStyle(s) {
        if (this.usingTools instanceof pencil_1.PencilTools) {
            this.usingTools.changeStyle(s);
        }
    }
    switchTypeTo(v) {
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
    }
    switchTypeToSelect() {
        this.switchTypeTo(ToolsEnum.選擇器);
    }
    switchTypeToPencil() {
        this.switchTypeTo(ToolsEnum.鉛筆);
    }
    switchTypeToShapeGenerate() {
        this.switchTypeTo(ToolsEnum.圖形生成);
    }
    switchTypeToTextRect() {
        this.switchTypeTo(ToolsEnum.文字框);
    }
    switchTypeToEraser() {
        this.switchTypeTo(ToolsEnum.擦子);
    }
}
exports.ToolsManagement = ToolsManagement;
//# sourceMappingURL=management.js.map