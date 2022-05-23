"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = void 0;
const _1 = require(".");
/**
 * 繪圖板，介接各個插件
 */
class Board {
    constructor(canvas, config) {
        /** 滑鼠旗標（是否點擊） */
        this.mouseFlag = "inactive";
        /** 所有被繪製的圖形 */
        this.shapes = new Map();
        /** 所有被刪除的圖形 */
        this.shapesTrash = new Map();
        /** 紀錄行為 */
        this.actionStore = [];
        /** 網路請求中間件 */
        this.__socket = null;
        this.__canvas = getCnavasElement(canvas);
        this.__ctx = checkCanvasContext(this.__canvas);
        this.setStaticCanvas();
        const { Socket, Tools = _1.ToolsManagement } = Object.assign({}, config);
        this.__tools = new Tools(this);
        this.__socket = Socket || null;
        this.decivePixelPatio = window.devicePixelRatio;
        this.initial();
        this.addListener();
    }
    get rootBlock() {
        return this.__rootBlock;
    }
    get canvas() {
        return this.__canvas;
    }
    get ctx() {
        return this.__ctx;
    }
    get canvasStatic() {
        return this.__canvasStatic;
    }
    get ctxStatic() {
        return this.__ctxStatic;
    }
    get toolsCtrl() {
        return this.__tools;
    }
    get socketCtrl() {
        return this.__socket;
    }
    /** 取得圖形物件 */
    getShapeById(id) {
        return this.shapes.get(id);
    }
    /** 添加圖形 */
    addShape(p, s, m) {
        const id = _1.UtilTools.RandomID(Array.from(this.shapes.keys()));
        this.shapes.set(id, new _1.BaseShape(id, this, p, s, m));
        this.draw(p, s);
    }
    deleteShapeByID(...idArray) {
        idArray.forEach((id) => {
            const bs = this.shapes.get(id);
            if (bs) {
                this.shapesTrash.set(id, bs);
                this.shapes.delete(id);
            }
        });
        const { width, height } = this.canvasStatic;
        this.ctxStatic.clearRect(0, 0, width, height);
        this.ctx.clearRect(0, 0, width, height);
        this.shapes.forEach((bs) => {
            this.ctxStatic.stroke(bs.path);
        });
    }
    deleteShape() {
        const idArray = [];
        this.shapes.forEach((item) => {
            if (item.isSelect) {
                idArray.push(item.id);
            }
        });
        this.deleteShapeByID(...idArray);
    }
    /** 初始化 canvas */
    initial() {
        this.settingChild();
    }
    /** 繪製到圖層級 */
    draw(p, s) {
        _1.UtilTools.injectStyle(this.ctxStatic, s);
        this.ctxStatic.stroke(p);
    }
    destroy() {
        this.removeListener();
    }
    setStaticCanvas() {
        this.__canvasStatic = getCnavasElement();
        this.__ctxStatic = checkCanvasContext(this.canvasStatic);
    }
    addListener() {
        this.canvas.addEventListener("mousedown", this.onEventStart.bind(this));
        this.canvas.addEventListener("touchstart", this.onEventStart.bind(this));
        this.canvas.addEventListener("mousemove", this.onEventMove.bind(this));
        this.canvas.addEventListener("touchmove", this.onEventMove.bind(this));
        this.canvas.addEventListener("mouseup", this.onEventEnd.bind(this));
        this.canvas.addEventListener("mouseleave", this.onEventEnd.bind(this));
        this.canvas.addEventListener("touchend", this.onEventEnd.bind(this));
        this.canvas.addEventListener("touchcancel", this.onEventEnd.bind(this));
        window.addEventListener("resize", this.resizeCanvas.bind(this));
    }
    removeListener() {
        this.canvas.removeEventListener("mousedown", this.onEventStart.bind(this));
        this.canvas.removeEventListener("touchstart", this.onEventStart.bind(this));
        this.canvas.removeEventListener("mousemove", this.onEventMove.bind(this));
        this.canvas.removeEventListener("touchmove", this.onEventMove.bind(this));
        this.canvas.removeEventListener("mouseup", this.onEventEnd.bind(this));
        this.canvas.removeEventListener("mouseleave", this.onEventEnd.bind(this));
        this.canvas.removeEventListener("touchend", this.onEventEnd.bind(this));
        this.canvas.removeEventListener("touchcancel", this.onEventEnd.bind(this));
        window.removeEventListener("resize", this.resizeCanvas.bind(this));
    }
    onEventStart(event) {
        if (this.mouseFlag === "inactive") {
            this.mouseFlag = "active";
            const position = this.eventToPosition(event);
            this.toolsCtrl.onEventStart(position);
        }
    }
    onEventMove(event) {
        const position = this.eventToPosition(event);
        if (this.mouseFlag === "active") {
            this.toolsCtrl.onEventMoveActive(position);
        }
        else {
            this.toolsCtrl.onEventMoveInActive(position);
        }
        // if (this.socketCtrl) {
        //   this.socketCtrl.postData();
        // }
    }
    onEventEnd(event) {
        if (this.mouseFlag === "active") {
            this.mouseFlag = "inactive";
            const position = this.eventToPosition(event);
            this.toolsCtrl.onEventEnd(position);
        }
    }
    /** 事件轉換canvas座標 */
    eventToPosition(event) {
        let x = 0, y = 0;
        if (_1.UtilTools.isMouseEvent(event)) {
            x = event.clientX;
            y = event.clientY;
        }
        else {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        }
        const { left, top, width, height } = this.canvas.getBoundingClientRect();
        const back = {
            x: ((x - left) / (this.canvas.width / this.decivePixelPatio / width)) *
                this.decivePixelPatio,
            y: ((y - top) / (this.canvas.height / this.decivePixelPatio / height)) *
                this.decivePixelPatio,
        };
        return back;
    }
    resizeCanvas() {
        // 清除畫面
        const { width, height } = this.canvasStatic;
        this.ctxStatic.clearRect(0, 0, width, height);
        this.ctx.clearRect(0, 0, width, height);
        this.setCanvasStyle(this.canvas);
        this.setCanvasStyle(this.canvasStatic);
        // 重新繪製
        this.shapes.forEach((item) => {
            this.ctxStatic.stroke(item.path);
            item.closeSolidRect();
        });
    }
    setCanvasStyle(el) {
        const clientWidth = window.innerWidth;
        const clientHeight = window.innerHeight;
        el.setAttribute("width", `${clientWidth * this.decivePixelPatio}px`);
        el.setAttribute("height", `${clientHeight * this.decivePixelPatio}px`);
        el.style.width = `${clientWidth}px`;
        el.style.height = `${clientHeight}px`;
    }
    /** 調整使用者給予的 Canvas */
    settingChild() {
        this.__rootBlock = document.createElement("div");
        this.rootBlock.style.position = "relative";
        this.canvas.after(this.rootBlock);
        this.setCanvasStyle(this.canvas);
        this.canvas.classList.add("event_paint");
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.setCanvasStyle(this.canvasStatic);
        this.canvasStatic.classList.add("show_paint");
        this.rootBlock.append(this.canvasStatic);
        this.rootBlock.appendChild(this.canvas);
    }
}
exports.Board = Board;
function getCnavasElement(c) {
    if (c instanceof HTMLCanvasElement) {
        return c;
    }
    else if (typeof c === "string") {
        const el = document.getElementById(c);
        if (el && el instanceof HTMLCanvasElement) {
            return el;
        }
    }
    return document.createElement("canvas");
}
function checkCanvasContext(c) {
    const ctx = c.getContext("2d");
    if (ctx) {
        return ctx;
    }
    else {
        throw new Error("無法獲取 getContext");
    }
}
