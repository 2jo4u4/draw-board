"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_1 = require("fabric");
const canvas = document.createElement("canvas");
document.body.append(canvas);
const myfabric = new fabric_1.fabric.Canvas(canvas);
const rect = new fabric_1.fabric.Rect({ top: 100, left: 100, width: 60, height: 60 });
myfabric.add(rect);
