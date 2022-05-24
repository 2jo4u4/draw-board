"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = void 0;
var _1 = require(".");
var Board = (function () {
    function Board(canvas, config) {
        this.mouseFlag = "inactive";
        this.shapes = new Map();
        this.shapesTrash = new Map();
        this.actionStore = [];
        this.__socket = null;
        this.__canvas = getCnavasElement(canvas);
        this.__ctx = checkCanvasContext(this.__canvas);
        this.setStaticCanvas();
        var _a = Object.assign({}, config), Socket = _a.Socket, _b = _a.Tools, Tools = _b === void 0 ? _1.ToolsManagement : _b;
        this.__tools = new Tools(this);
        this.__socket = Socket || null;
        this.decivePixelPatio = window.devicePixelRatio;
        this.initial();
        this.addListener();
    }
    Object.defineProperty(Board.prototype, "rootBlock", {
        get: function () {
            return this.__rootBlock;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Board.prototype, "canvas", {
        get: function () {
            return this.__canvas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Board.prototype, "ctx", {
        get: function () {
            return this.__ctx;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Board.prototype, "canvasStatic", {
        get: function () {
            return this.__canvasStatic;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Board.prototype, "ctxStatic", {
        get: function () {
            return this.__ctxStatic;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Board.prototype, "toolsCtrl", {
        get: function () {
            return this.__tools;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Board.prototype, "socketCtrl", {
        get: function () {
            return this.__socket;
        },
        enumerable: false,
        configurable: true
    });
    Board.prototype.clearCanvas = function (type) {
        var _a = this.canvasStatic, width = _a.width, height = _a.height;
        type !== "static" && this.ctx.clearRect(0, 0, width, height);
        type !== "event" && this.ctxStatic.clearRect(0, 0, width, height);
    };
    Board.prototype.getShapeById = function (id) {
        return this.shapes.get(id);
    };
    Board.prototype.addShape = function (p, s, m) {
        var id = _1.UtilTools.RandomID(Array.from(this.shapes.keys()));
        this.shapes.set(id, new _1.BaseShape(id, this, p, s, m));
        this.drawByPath(p, s);
    };
    Board.prototype.drawByPath = function (p, s) {
        _1.UtilTools.injectStyle(this.ctxStatic, s);
        this.ctxStatic.stroke(p);
    };
    Board.prototype.drawByBs = function (bs) {
        this.drawByPath(bs.path, bs.style);
    };
    Board.prototype.deleteShapeByID = function () {
        var _this = this;
        var idArray = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            idArray[_i] = arguments[_i];
        }
        idArray.forEach(function (id) {
            var bs = _this.shapes.get(id);
            if (bs) {
                _this.shapesTrash.set(id, bs);
                _this.shapes.delete(id);
            }
        });
        var _a = this.canvasStatic, width = _a.width, height = _a.height;
        this.ctxStatic.clearRect(0, 0, width, height);
        this.ctx.clearRect(0, 0, width, height);
        this.shapes.forEach(function (bs) {
            _this.ctxStatic.stroke(bs.path);
        });
    };
    Board.prototype.deleteShape = function () {
        var idArray = [];
        this.shapes.forEach(function (item) {
            if (item.isSelect) {
                idArray.push(item.id);
            }
        });
        this.deleteShapeByID.apply(this, idArray);
    };
    Board.prototype.initial = function () {
        this.settingChild();
    };
    Board.prototype.destroy = function () {
        this.removeListener();
    };
    Board.prototype.setStaticCanvas = function () {
        this.__canvasStatic = getCnavasElement();
        this.__ctxStatic = checkCanvasContext(this.canvasStatic);
    };
    Board.prototype.addListener = function () {
        this.canvas.addEventListener("mousedown", this.onEventStart.bind(this));
        this.canvas.addEventListener("touchstart", this.onEventStart.bind(this));
        this.canvas.addEventListener("mousemove", this.onEventMove.bind(this));
        this.canvas.addEventListener("touchmove", this.onEventMove.bind(this));
        this.canvas.addEventListener("mouseup", this.onEventEnd.bind(this));
        this.canvas.addEventListener("mouseleave", this.onEventEnd.bind(this));
        this.canvas.addEventListener("touchend", this.onEventEnd.bind(this));
        this.canvas.addEventListener("touchcancel", this.onEventEnd.bind(this));
        window.addEventListener("resize", this.resizeCanvas.bind(this));
    };
    Board.prototype.removeListener = function () {
        this.canvas.removeEventListener("mousedown", this.onEventStart.bind(this));
        this.canvas.removeEventListener("touchstart", this.onEventStart.bind(this));
        this.canvas.removeEventListener("mousemove", this.onEventMove.bind(this));
        this.canvas.removeEventListener("touchmove", this.onEventMove.bind(this));
        this.canvas.removeEventListener("mouseup", this.onEventEnd.bind(this));
        this.canvas.removeEventListener("mouseleave", this.onEventEnd.bind(this));
        this.canvas.removeEventListener("touchend", this.onEventEnd.bind(this));
        this.canvas.removeEventListener("touchcancel", this.onEventEnd.bind(this));
        window.removeEventListener("resize", this.resizeCanvas.bind(this));
    };
    Board.prototype.onEventStart = function (event) {
        if (this.mouseFlag === "inactive") {
            this.mouseFlag = "active";
            var position = this.eventToPosition(event);
            this.toolsCtrl.onEventStart(position);
        }
    };
    Board.prototype.onEventMove = function (event) {
        var position = this.eventToPosition(event);
        if (this.mouseFlag === "active") {
            this.toolsCtrl.onEventMoveActive(position);
        }
        else {
            this.toolsCtrl.onEventMoveInActive(position);
        }
    };
    Board.prototype.onEventEnd = function (event) {
        if (this.mouseFlag === "active") {
            this.mouseFlag = "inactive";
            var position = this.eventToPosition(event);
            this.toolsCtrl.onEventEnd(position);
        }
    };
    Board.prototype.eventToPosition = function (event) {
        var x = 0, y = 0;
        if (_1.UtilTools.isMouseEvent(event)) {
            x = event.clientX;
            y = event.clientY;
        }
        else {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        }
        var _a = this.canvas.getBoundingClientRect(), left = _a.left, top = _a.top, width = _a.width, height = _a.height;
        var back = {
            x: ((x - left) / (this.canvas.width / this.decivePixelPatio / width)) *
                this.decivePixelPatio,
            y: ((y - top) / (this.canvas.height / this.decivePixelPatio / height)) *
                this.decivePixelPatio,
        };
        return back;
    };
    Board.prototype.resizeCanvas = function () {
        var _this = this;
        this.clearCanvas();
        this.setCanvasStyle(this.canvas);
        this.setCanvasStyle(this.canvasStatic);
        this.shapes.forEach(function (item) {
            _this.drawByBs(item);
        });
    };
    Board.prototype.setCanvasStyle = function (el) {
        var clientWidth = window.innerWidth;
        var clientHeight = window.innerHeight;
        el.setAttribute("width", "".concat(clientWidth * this.decivePixelPatio, "px"));
        el.setAttribute("height", "".concat(clientHeight * this.decivePixelPatio, "px"));
        el.style.width = "".concat(clientWidth, "px");
        el.style.height = "".concat(clientHeight, "px");
    };
    Board.prototype.settingChild = function () {
        this.__rootBlock = document.createElement("div");
        this.rootBlock.style.position = "relative";
        this.rootBlock.classList.add("canvas");
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
    };
    return Board;
}());
exports.Board = Board;
function getCnavasElement(c) {
    if (c instanceof HTMLCanvasElement) {
        return c;
    }
    else if (typeof c === "string") {
        var el = document.getElementById(c);
        if (el && el instanceof HTMLCanvasElement) {
            return el;
        }
    }
    return document.createElement("canvas");
}
function checkCanvasContext(c) {
    var ctx = c.getContext("2d");
    if (ctx) {
        return ctx;
    }
    else {
        throw new Error("無法獲取 getContext");
    }
}
