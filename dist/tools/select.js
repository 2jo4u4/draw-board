"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectTools = void 0;
const selectRect_1 = require("./../shape/selectRect");
const __1 = require("..");
const defaultFlexboxStyle = {
    lineWidth: 2,
    lineColor: "#00000050",
    lineDash: __1.dashedLine,
};
class SelectTools {
    constructor(board) {
        this.startPosition = { x: 0, y: 0 };
        this.board = board;
        this.selectFlag = "none";
        this.selectSolidRect = new selectRect_1.SelectSolidRect(board);
    }
    onDestroy() {
        this.board.clearCanvas("event");
        this.board.shapes.forEach((item) => {
        });
    }
    onEventStart(v) {
        this.startPosition = v;
        if (this.board.ctx.isPointInPath(this.selectSolidRect.bindingBox, v.x, v.y)) {
            this.selectFlag = "selected";
            this.moveStart(v);
        }
        else {
            this.selectFlag = "none";
            this.selectStart(v);
        }
    }
    onEventMoveActive(v) {
        switch (this.selectFlag) {
            case "none":
                this.select(v);
                break;
            case "selected":
                this.move(v);
                break;
        }
    }
    onEventMoveInActive(v) {
        if (this.board.ctx.isPointInPath(this.selectSolidRect.bindingBox, v.x, v.y)) {
            this.board.rootBlock.style.cursor = "move";
        }
        else {
            this.board.rootBlock.style.cursor = "default";
        }
    }
    onEventEnd(v) {
        switch (this.selectFlag) {
            case "none":
                this.selectEnd(v);
                break;
            case "selected":
                this.moveEnd(v);
                break;
        }
    }
    selectStart(v) {
        this.selectSolidRect.closeSolidRect();
        this.board.shapes.forEach((bs) => {
            bs.isSelect = false;
        });
        this.settingFlexBox();
    }
    select(v) {
        const { width, height } = this.board.canvas, { x, y } = this.startPosition, { x: nX, y: nY } = v;
        this.board.ctx.clearRect(0, 0, width, height);
        this.board.ctx.strokeRect(x, y, nX - x, nY - y);
    }
    selectEnd(v) {
        this.drawOverFlexBox();
        let minRectVec, shape = [];
        if (v.x === this.startPosition.x && v.y === this.startPosition.y) {
            const single = Array.from(this.board.shapes)
                .reverse()
                .find((item) => this.isSelected(v, item[1]));
            if (single) {
                shape = [single];
                minRectVec = single[1].minRect;
            }
        }
        else {
            const minRect = __1.UtilTools.generateMinRect(v, this.startPosition);
            const regBS = Array.from(this.board.shapes).filter((item) => this.isSelected(minRect, item[1]));
            if (regBS.length > 0) {
                shape = regBS;
                minRectVec = __1.UtilTools.mergeMinRect(...regBS.map((bs) => bs[1].minRect));
            }
        }
        if (shape[0]) {
            this.selectFlag = "selected";
            this.selectSolidRect.settingAndOpen(minRectVec, ...shape.map((item) => {
                item[1].isSelect = true;
                return item[1];
            }));
        }
        else {
            this.selectFlag = "none";
        }
    }
    moveStart(v) {
        this.selectSolidRect.moveStart(v);
    }
    move(v) {
        this.selectSolidRect.move(v);
    }
    moveEnd(v) {
        this.selectSolidRect.moveEnd(v);
    }
    isSelected(v, bs) {
        if (__1.UtilTools.isVec2(v)) {
            return this.board.ctx.isPointInPath(bs.bindingBox, v.x, v.y);
        }
        else {
            return this.isInRectBlock(v, bs);
        }
    }
    isInRectBlock(r, bs) {
        const { leftTop: { x: selectx1, y: selecty1 }, rightBottom: { x: selectx2, y: selecty2 }, } = r;
        const { leftTop: { x: x1, y: y1 }, rightBottom: { x: x2, y: y2 }, } = bs.minRect;
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
            const foreCorner = [
                { x: selectx1, y: selecty1 },
                { x: selectx1, y: selecty2 },
                { x: selectx2, y: selecty1 },
                { x: selectx2, y: selecty2 },
            ];
            return Boolean(foreCorner.find(({ x, y }) => {
                return this.board.ctx.isPointInPath(bs.bindingBox, x, y);
            }));
        }
    }
    settingFlexBox() {
        __1.UtilTools.injectStyle(this.board.ctx, defaultFlexboxStyle);
    }
    drawOverFlexBox() {
        this.board.clearCanvas("event");
    }
}
exports.SelectTools = SelectTools;
//# sourceMappingURL=select.js.map