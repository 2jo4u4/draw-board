"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseShape = void 0;
const __1 = require("..");
const trash_bin_svgrepo_com_svg_1 = __importDefault(require("../assets/trash-bin-svgrepo-com.svg"));
const redo_svgrepo_com_svg_1 = __importDefault(require("../assets/redo-svgrepo-com.svg"));
const defaultSolidboxStyle = {
    lineWidth: 2,
    lineColor: "#00000080",
    lineDash: __1.dashedLine,
};
/**
 * 圖形基本類
 */
class BaseShape {
    constructor(id, board, path, style, minRect) {
        this.$type = "base-shape";
        /** 紀錄一個路徑的最小包覆矩形 */
        this.minRect = {
            leftTop: { x: 0, y: 0 },
            rightBottom: { x: 0, y: 0 },
        };
        /** 是否被選取 */
        this.isSelect = false;
        this.id = id;
        this.board = board;
        this.path = new Path2D(path);
        this.style = Object.assign(__1.defaultStyle, style);
        this.minRect = minRect;
        const { leftTop: { x: sX, y: sY }, rightBottom: { x: eX, y: eY }, } = minRect;
        this.solidRectPath = new Path2D();
        // 稍微加大範圍
        this.solidRectPath.rect(sX - __1.padding, sY - __1.padding, eX - sX + __1.padding * 2, eY - sY + __1.padding * 2);
        this.actionBar = new ActionBar(board, this, ["delete", "rotate"]);
    }
    openSolidRect(config) {
        const _config = Object.assign({}, config);
        if (!this.isSelect) {
            this.isSelect = true;
            this.onSolidBoxStart();
            if (config) {
                if (_config.mrv) {
                    this.board.ctx.stroke(__1.UtilTools.drawMinRectVecPath(_config.mrv, __1.padding));
                }
                else {
                    this.board.ctx.stroke(this.solidRectPath);
                }
                config.openBar && this.actionBar.openBar(_config.mrv);
            }
        }
    }
    closeSolidRect() {
        if (this.isSelect) {
            this.isSelect = false;
            this.actionBar.closeBar();
            // todo
        }
    }
    /** 選取固定框設定 */
    onSolidBoxStart() {
        __1.UtilTools.injectStyle(this.board.ctx, defaultSolidboxStyle);
    }
}
exports.BaseShape = BaseShape;
const interval = 60; //px
/**
 * 選取後的控制欄位
 */
class ActionBar {
    constructor(board, bs, use) {
        this.openFlag = false;
        this.board = board;
        this.baseShape = bs;
        this.rootBlock = board.rootBlock;
        this.block = document.createElement("div");
        this.initial(use);
    }
    initial(use) {
        this.block.style.position = "absolute";
        this.block.style.border = "1px solid red";
        this.icon(use);
    }
    openBar(mrv) {
        if (!this.openFlag) {
            this.openFlag = true;
            const { leftTop: { x: x1, y: y1 }, rightBottom: { x: x2, y: y2 }, } = mrv || this.baseShape.minRect;
            const width = x2 - x1 + __1.padding * 2 + defaultSolidboxStyle.lineWidth * 2;
            this.block.style.top = `${y1 - interval}px`;
            this.block.style.left = `${x1 - __1.padding - defaultSolidboxStyle.lineWidth}px`;
            this.block.style.width = `${width}px`;
            this.rootBlock.append(this.block);
        }
    }
    closeBar() {
        if (this.openFlag) {
            this.openFlag = false;
            this.block.remove();
        }
    }
    icon(type) {
        type.forEach((item) => {
            let btn;
            switch (item) {
                case "delete":
                    btn = this.generateBtn(trash_bin_svgrepo_com_svg_1.default);
                    btn.onclick = () => {
                        this.board.deleteShape();
                        this.block.remove();
                    };
                    break;
                case "rotate":
                    btn = this.generateBtn(redo_svgrepo_com_svg_1.default);
                    btn.onclick = () => {
                        console.log("rotate");
                    };
                    break;
            }
            this.block.append(btn);
        });
    }
    generateBtn(src) {
        const img = new Image(24, 24);
        img.style.cursor = "pointer";
        img.src = src;
        return img;
    }
}
