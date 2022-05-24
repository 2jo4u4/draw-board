"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilTools = exports.dashedLine = exports.padding = exports.defaultStyle = void 0;
exports.defaultStyle = {
    lineColor: "#000",
    lineWidth: 2,
    fillColor: undefined,
    lineDash: [],
};
exports.padding = 8;
exports.dashedLine = [10, 10];
class UtilTools {
    static generateMinRect(v1, v2) {
        const { x: x1, y: y1 } = v1;
        const { x: x2, y: y2 } = v2;
        return {
            leftTop: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
            rightBottom: { x: Math.max(x1, x2), y: Math.max(y1, y2) },
        };
    }
    static isVec2(v) {
        return Object.prototype.hasOwnProperty.call(v, "x");
    }
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
    static isMouseEvent(event) {
        return event instanceof MouseEvent;
    }
    static RandomID(s) {
        const id = Math.random().toString(36).slice(2, 12);
        if (s && s.find((item) => item === id)) {
            return UtilTools.RandomID(s);
        }
        else {
            return id;
        }
    }
    static injectStyle(ctx, s) {
        const { lineColor, lineWidth, lineDash } = s;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(lineDash);
    }
    static minRectToPath(mrv, padding = 0) {
        const { leftTop: { x: x1, y: y1 }, rightBottom: { x: x2, y: y2 }, } = mrv;
        const path = new Path2D();
        path.rect(x1 - padding, y1 - padding, x2 - x1 + padding * 2, y2 - y1 + padding * 2);
        return path;
    }
}
exports.UtilTools = UtilTools;
//# sourceMappingURL=util.js.map