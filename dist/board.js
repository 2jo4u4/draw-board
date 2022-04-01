"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = void 0;
const _1 = require(".");
/**
 * 繪圖板，介接各個插件
 */
class Board {
    constructor(canvasEl, config) {
        /** 滑鼠旗標（是否點擊） */
        this.mouseFlag = "inactive";
        /** 所有被繪製的圖形 */
        this.shapes = new Map();
        /** 紀錄繪圖行為 */
        this.store = [];
        /** 網路請求中間件 */
        this.__socket = null;
        if (canvasEl instanceof HTMLCanvasElement) {
            this.__canvas = canvasEl;
            this.__ctx = canvasEl.getContext("2d");
            const { Socket, Tools = _1.ToolsManagement } = Object.assign({}, config);
            this.__tools = new Tools(this);
            this.__socket = Socket ? Socket : null;
            this.initial();
            this.addListener();
        }
        else {
            throw new Error("請提供 HTMLCanvasElement!!");
        }
    }
    get canvas() {
        return this.__canvas;
    }
    get ctx() {
        return this.__ctx;
    }
    get toolsCtrl() {
        return this.__tools;
    }
    get socketCtrl() {
        return this.__socket;
    }
    findShape(id) {
        return this.shapes.get(id);
    }
    addShape(p, s, m) {
        const id = _1.UtilTools.RandomID(Array.from(this.shapes.keys()));
        this.shapes.set(id, new _1.BaseShape(id, this, p, s, m));
    }
    initial() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    destroy() {
        this.removeListener();
    }
    /** 可復原 */
    updata(p) {
        this.ctx.stroke(p);
        this.saveCanvas();
    }
    saveCanvas() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.width);
        this.store.push(imageData);
    }
    resumeCanvas() { }
    addListener() {
        this.canvas.addEventListener("mousedown", this.onEventStart.bind(this));
        this.canvas.addEventListener("touchstart", this.onEventStart.bind(this));
        this.canvas.addEventListener("mousemove", this.onEventMove.bind(this));
        this.canvas.addEventListener("touchmove", this.onEventMove.bind(this));
        this.canvas.addEventListener("mouseup", this.onEventEnd.bind(this));
        this.canvas.addEventListener("mouseleave", this.onEventEnd.bind(this));
        this.canvas.addEventListener("touchend", this.onEventEnd.bind(this));
        this.canvas.addEventListener("touchcancel", this.onEventEnd.bind(this));
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
    }
    onEventStart(event) {
        if (this.mouseFlag === "inactive") {
            this.mouseFlag = "active";
            const position = this.eventToPosition(event);
            this.toolsCtrl.onEventStart(position);
        }
    }
    onEventMove(event) {
        let action = _1.UserAction.移動滑鼠;
        if (this.mouseFlag === "active") {
            const position = this.eventToPosition(event);
            this.toolsCtrl.onEventMove(position);
            action =
                this.toolsCtrl.toolsType === _1.ToolsEnum.鉛筆
                    ? _1.UserAction.新增
                    : _1.UserAction.移動滑鼠;
        }
        if (this.socketCtrl) {
            this.socketCtrl.postData(action);
        }
    }
    onEventEnd(event) {
        if (this.mouseFlag === "active") {
            this.mouseFlag = "inactive";
            const position = this.eventToPosition(event);
            this.toolsCtrl.onEventEnd(position);
        }
    }
    /** 事件轉換座標 */
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
        let box = this.canvas.getBoundingClientRect();
        return {
            x: (x - box.left) / (this.canvas.width / box.width),
            y: (y - box.top) / (this.canvas.height / box.height),
        };
    }
}
exports.Board = Board;
