import { fabric } from "fabric";

const canvas = document.createElement("canvas");
document.body.append(canvas);

const myfabric = new fabric.Canvas(canvas);

const rect = new fabric.Rect({ top: 100, left: 100, width: 60, height: 60 });
myfabric.add(rect);
