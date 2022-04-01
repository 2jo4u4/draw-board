"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseShape = exports.defaultStyle = void 0;
exports.defaultStyle = {
    lineColor: "#000",
    lineWidth: 2,
    fillColor: undefined,
};
const padding = 8; // px
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
        this.id = id;
        this.board = board;
        this.path = new Path2D(path);
        this.style = Object.assign(exports.defaultStyle, style);
        this.minRect = minRect;
        const { leftTop: { x: sX, y: sY }, rightBottom: { x: eX, y: eY }, } = minRect;
        this.selectRectPath = new Path2D();
        this.selectRectPath.rect(sX - padding, sY - padding, eX - sX + padding * 2, eY - sY + padding * 2);
    }
    isSelected(v) {
        return this.board.ctx.isPointInPath(this.selectRectPath, v.x, v.y);
    }
    openSelectRect() {
        this.board.updata(this.selectRectPath);
    }
}
exports.BaseShape = BaseShape;
