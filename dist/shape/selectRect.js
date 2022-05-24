"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectSolidRect = void 0;
const _1 = require(".");
const __1 = require("..");
const trash_bin_svgrepo_com_svg_1 = __importDefault(require("../assets/trash-bin-svgrepo-com.svg"));
const redo_svgrepo_com_svg_1 = __importDefault(require("../assets/redo-svgrepo-com.svg"));
const defaultSolidboxStyle = {
    lineWidth: 2,
    lineColor: "#00000080",
    lineDash: __1.dashedLine,
    fillColor: undefined,
};
class SelectSolidRect extends _1.BaseShape {
    constructor(board) {
        super("selectRect_onlyOne", board, new Path2D(), defaultSolidboxStyle, {
            rightBottom: { x: 0, y: 0 },
            leftTop: { x: 0, y: 0 },
        });
        this.shapes = [];
        this.$type = "selectSolid-shape";
        this.actionBar = new ActionBar(board, this, ["delete"]);
    }
    settingAndOpen(mrv, ...bsArray) {
        this.setting(mrv, ...bsArray);
        this.draw();
        this.openSolidRect(mrv);
    }
    setting(mrv, ...bsArray) {
        this.minRect = mrv;
        this.settingPath(__1.UtilTools.minRectToPath(mrv, __1.padding));
        this.shapes = bsArray;
    }
    openSolidRect(mrv) {
        this.settingCtx();
        this.actionBar.openBar(mrv);
    }
    closeSolidRect() {
        this.actionBar.closeBar();
        this.settingPath();
    }
    moveStart(v) {
        this.board.clearCanvas();
        this.board.shapes.forEach((bs) => {
            if (bs.isSelect) {
                bs.moveStart(v);
            }
            else {
                __1.UtilTools.injectStyle(this.board.ctx, bs.style);
                this.board.ctxStatic.stroke(bs.path);
            }
        });
        this.draw();
        super.moveStart(v);
    }
    move(v) {
        this.board.clearCanvas("event");
        this.shapes.forEach((bs) => {
            bs.move(v);
        });
        this.actionBar.move(this.getOffset(this.regPosition, v));
        super.move(v);
        this.draw();
    }
    moveEnd(v) {
        this.board.clearCanvas();
        this.shapes.forEach((bs) => {
            bs.moveEnd(v);
        });
        super.moveEnd(v);
        this.board.shapes.forEach((bs) => {
            this.board.drawByBs(bs);
        });
        this.draw();
    }
    draw() {
        __1.UtilTools.injectStyle(this.board.ctx, this.style);
        this.board.ctx.stroke(this.bindingBox);
    }
    settingPath(p) {
        if (p) {
            this.bindingBox = p;
        }
        else {
            const path = new Path2D();
            this.bindingBox = path;
        }
    }
    settingCtx() {
        __1.UtilTools.injectStyle(this.board.ctx, defaultSolidboxStyle);
    }
}
exports.SelectSolidRect = SelectSolidRect;
const interval = 60;
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
    move(offset) {
        this.block.style.top = `${parseInt(this.block.style.top) + offset[1]}px`;
        this.block.style.left = `${parseInt(this.block.style.left) + offset[0]}px`;
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
//# sourceMappingURL=selectRect.js.map