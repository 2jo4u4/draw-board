"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fabric_1 = require("fabric");
var canvas = document.createElement("canvas");
document.body.append(canvas);
var myfabric = new fabric_1.fabric.Canvas(canvas);
var rect = new fabric_1.fabric.Rect({ top: 100, left: 100, width: 60, height: 60 });
myfabric.add(rect);
