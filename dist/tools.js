"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsManagement = exports.LineWidth = exports.ToolsEnum = void 0;
const _1 = require(".");
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
/**
 * 控制插件
 */
class ToolsManagement {
    constructor(board) {
        this.board = board;
        this.switchTypeToSelect(); // 設定初始工具
    }
    get toolsType() {
        return this.__toolsType;
    }
    /** 觸摸/滑鼠下壓 */
    onEventStart(v) {
        this.usingTools.onEventStart(v);
    }
    /** 手指/滑鼠 移動過程 */
    onEventMove(v) {
        this.usingTools.onEventMove(v);
    }
    /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
    onEventEnd(v) {
        this.usingTools.onEventEnd(v);
    }
    changePencilStyle(s) {
        if (this.usingTools instanceof PencilTools) {
            this.usingTools.changeStyle(s);
        }
    }
    switchTypeTo(v) {
        this.__toolsType = v;
        switch (v) {
            case ToolsEnum.選擇器:
                this.usingTools = new SelectTools(this.board);
                break;
            case ToolsEnum.鉛筆:
                this.usingTools = new PencilTools(this.board);
                break;
            case ToolsEnum.擦子:
                this.usingTools = new SelectTools(this.board);
                break;
            case ToolsEnum.文字框:
                this.usingTools = new SelectTools(this.board);
                break;
            case ToolsEnum.圖形生成:
                this.usingTools = new SelectTools(this.board);
                break;
            default:
                break;
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
class BaseTools {
    onEventStart(v) { }
    onEventMove(v) { }
    onEventEnd(v) { }
}
/** 選擇器 */
class SelectTools {
    constructor(board) {
        /** 選取前的畫面 */
        this.beforeSelectScreen = null;
        /** 滑鼠起點 */
        this.startPosition = { x: 0, y: 0 };
        const { width, height } = board.canvas;
        this.board = board;
        this.beforeSelectScreen = board.ctx.getImageData(0, 0, width, height);
        this.selectFlag = "none";
    }
    onEventStart(v) {
        this.startPosition = v;
    }
    onEventMove(v) {
        switch (this.selectFlag) {
            case "none":
                (() => {
                    const { x, y } = this.startPosition;
                    const { x: nX, y: nY } = v;
                    this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0);
                    this.board.ctx.strokeRect(x, y, nX - x, nY - y);
                })();
                break;
            case "multiple":
                break;
            case "single":
                break;
            default:
                break;
        }
    }
    onEventEnd(v) {
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
            // 點擊
            const shape = Array.from(this.board.shapes)
                .reverse()
                .find((item) => item[1].isSelected(v));
            if (shape) {
                shape[1].openSelectRect();
            }
        }
        else {
            // 移動
            this.board.ctx.putImageData(this.beforeSelectScreen, 0, 0);
        }
    }
}
/** 鉛筆 */
class PencilTools {
    constructor(board) {
        this.drawStyle = _1.defaultStyle;
        this.minRect = {
            leftTop: { x: 0, y: 0 },
            rightBottom: { x: 0, y: 0 },
        };
        this.board = board;
    }
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
        this.minRect = _1.UtilTools.newMinRect(v, this.minRect);
    }
    onEventEnd(v) {
        this.path.lineTo(v.x, v.y);
        this.board.ctx.stroke(this.path);
        this.board.addShape(this.path, this.drawStyle, _1.UtilTools.newMinRect(v, this.minRect));
    }
}
