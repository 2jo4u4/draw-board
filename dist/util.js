"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilTools = void 0;
/** 計算函式 / 工具函式 */
class UtilTools {
    static generateMinRect(v1, v2) {
        const { x: x1, y: y1 } = v1;
        const { x: x2, y: y2 } = v2;
        return {
            leftTop: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
            rightBottom: { x: Math.max(x1, x2), y: Math.max(y1, y2) },
        };
    }
    /**
     * 計算新座標是否影響矩形
     * @param vec 座標
     * @param minRectVec 矩形座標
     * @returns 新矩形座標
     */
    static newMinRect(vec, minRectVec) {
        const cp = UtilTools.deepClone(minRectVec);
        const { leftTop, rightBottom } = minRectVec;
        const { x, y } = vec;
        if (x < leftTop.x && x < rightBottom.x) {
            cp.leftTop.x = x;
        }
        else if (x > leftTop.x && x > rightBottom.x) {
            cp.rightBottom.x = x;
        }
        if (y < leftTop.y && y < rightBottom.y) {
            cp.leftTop.y = y;
        }
        else if (y > leftTop.y && y > rightBottom.y) {
            cp.rightBottom.y = y;
        }
        return cp;
    }
    /**
     * 計算最小矩形 且 可包含所有傳入之矩形
     * @param arge 各個矩形
     * @returns 可包含所有矩形之最小矩形
     */
    static mergeMinRect(...arge) {
        const rect = {
            leftTop: { x: Infinity, y: Infinity },
            rightBottom: { x: 0, y: 0 },
        };
        arge.forEach((item) => {
            const { leftTop: { x: sx, y: sy }, rightBottom: { x: ex, y: ey }, } = item;
            const { leftTop: { x: nsx, y: nsy }, rightBottom: { x: nex, y: ney }, } = rect;
            rect.leftTop.x = Math.min(sx, nsx);
            rect.leftTop.y = Math.min(sy, nsy);
            rect.rightBottom.x = Math.max(ex, nex);
            rect.rightBottom.y = Math.max(ey, ney);
        });
        return rect;
    }
    /** 深拷貝 */
    static deepClone(o) {
        const newObject = Object.assign({}, o);
        for (const key in o) {
            if (Object.prototype.hasOwnProperty.call(o, key)) {
                const element = o[key];
                if (typeof element === "object") {
                    newObject[key] = UtilTools.deepClone(element);
                }
            }
        }
        return newObject;
    }
    /** 事件分辨 */
    static isMouseEvent(event) {
        return event instanceof MouseEvent;
    }
    /**
     * 隨機命名
     * @param s 已存在的ID陣列（可不傳遞 不保證ID是否唯一）
     * @returns
     */
    static RandomID(s) {
        const id = Math.random().toString(36).slice(2, 12);
        if (s && s.find((item) => item === id)) {
            return UtilTools.RandomID(s);
        }
        else {
            return id;
        }
    }
}
exports.UtilTools = UtilTools;
