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
var UtilTools = (function () {
    function UtilTools() {
    }
    UtilTools.generateMinRect = function (v1, v2) {
        var x1 = v1.x, y1 = v1.y;
        var x2 = v2.x, y2 = v2.y;
        return {
            leftTop: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
            rightBottom: { x: Math.max(x1, x2), y: Math.max(y1, y2) },
        };
    };
    UtilTools.isVec2 = function (v) {
        return Object.prototype.hasOwnProperty.call(v, "x");
    };
    UtilTools.newMinRect = function (vec, minRectVec) {
        var cp = UtilTools.deepClone(minRectVec);
        var leftTop = minRectVec.leftTop, rightBottom = minRectVec.rightBottom;
        var x = vec.x, y = vec.y;
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
    };
    UtilTools.mergeMinRect = function () {
        var arge = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arge[_i] = arguments[_i];
        }
        var rect = {
            leftTop: { x: Infinity, y: Infinity },
            rightBottom: { x: 0, y: 0 },
        };
        arge.forEach(function (item) {
            var _a = item.leftTop, sx = _a.x, sy = _a.y, _b = item.rightBottom, ex = _b.x, ey = _b.y;
            var _c = rect.leftTop, nsx = _c.x, nsy = _c.y, _d = rect.rightBottom, nex = _d.x, ney = _d.y;
            rect.leftTop.x = Math.min(sx, nsx);
            rect.leftTop.y = Math.min(sy, nsy);
            rect.rightBottom.x = Math.max(ex, nex);
            rect.rightBottom.y = Math.max(ey, ney);
        });
        return rect;
    };
    UtilTools.deepClone = function (o) {
        var newObject = Object.assign({}, o);
        for (var key in o) {
            if (Object.prototype.hasOwnProperty.call(o, key)) {
                var element = o[key];
                if (typeof element === "object") {
                    newObject[key] = UtilTools.deepClone(element);
                }
            }
        }
        return newObject;
    };
    UtilTools.isMouseEvent = function (event) {
        return event instanceof MouseEvent;
    };
    UtilTools.RandomID = function (s) {
        var id = Math.random().toString(36).slice(2, 12);
        if (s && s.find(function (item) { return item === id; })) {
            return UtilTools.RandomID(s);
        }
        else {
            return id;
        }
    };
    UtilTools.injectStyle = function (ctx, s) {
        var lineColor = s.lineColor, lineWidth = s.lineWidth, lineDash = s.lineDash;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(lineDash);
    };
    UtilTools.minRectToPath = function (mrv, padding) {
        if (padding === void 0) { padding = 0; }
        var _a = mrv.leftTop, x1 = _a.x, y1 = _a.y, _b = mrv.rightBottom, x2 = _b.x, y2 = _b.y;
        var path = new Path2D();
        path.rect(x1 - padding, y1 - padding, x2 - x1 + padding * 2, y2 - y1 + padding * 2);
        return path;
    };
    return UtilTools;
}());
exports.UtilTools = UtilTools;
