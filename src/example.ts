import * as math from "mathjs";
import * as pdfjsLib from "pdfjs-dist";
import {
  Board,
  Rect,
  ToolsEnum,
  UtilTools,
  BaseShape,
  ImageShape,
  PDFShape,
} from ".";

const canvas = document.createElement("canvas");
const grid = document.createElement("canvas");
const tools = document.createElement("ul");
const p = document.createElement("p");
const src = "https://i.imgur.com/yBcdym6.jpeg";
const pdfsrc =
  "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf";
const gridCtx = grid.getContext("2d") as CanvasRenderingContext2D;

function drawGrid() {
  document.body.append(grid, canvas, p, tools);
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  grid.setAttribute("width", `${innerWidth * devicePixelRatio}px`);
  grid.setAttribute("height", `${innerHeight * devicePixelRatio}px`);
  grid.style.width = `${innerWidth}px`;
  grid.style.height = `${innerHeight}px`;
  grid.style.position = "absolute";

  const style1 = "#ff000030";
  const style2 = "#00000030";
  const style3 = "#00000010";

  for (let x = 0; x < innerWidth * devicePixelRatio; x += 10) {
    if (x % 50 === 0 && x % 100 === 0) {
      gridCtx.strokeStyle = style1;
    } else if (x % 50 === 0) {
      gridCtx.strokeStyle = style2;
    } else {
      gridCtx.strokeStyle = style3;
    }
    gridCtx.beginPath();
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, innerHeight * devicePixelRatio);
    gridCtx.closePath();
    gridCtx.stroke();
  }

  for (let y = 0; y < innerWidth * devicePixelRatio; y += 10) {
    if (y % 50 === 0 && y % 100 === 0) {
      gridCtx.strokeStyle = style1;
    } else if (y % 50 === 0) {
      gridCtx.strokeStyle = style2;
    } else {
      gridCtx.strokeStyle = style3;
    }
    gridCtx.beginPath();
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(innerWidth * devicePixelRatio, y);
    gridCtx.closePath();
    gridCtx.stroke();
  }
}
function develop() {
  const board = new Board(canvas);
  initialTools();

  // new ImageShape("test-image", board, src);

  // new PDFShape(
  //   "asdasd",
  //   board,
  //   pdfsrc
  // );

  function AddTools(v: ToolsEnum) {
    const child = document.createElement("li");
    const text =
      Object.entries(ToolsEnum).find(([key, val]) => val === v)?.[0] ||
      "未定義工具";
    child.innerText = text;
    child.addEventListener("click", () => {
      p.innerText = `目前工具：${text}`;
      board.toolsCtrl.switchTypeTo(v);
    });
    tools.appendChild(child);
  }

  function initialTools() {
    tools.style.cursor = "pointer";
    board.toolsCtrl.switchTypeToSelect();
    p.innerText = `目前工具： 選擇器`;
    AddTools(ToolsEnum.鉛筆);
    AddTools(ToolsEnum.選擇器);
    AddTools(ToolsEnum.擦子);
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  coloe: string,
  m?: DOMMatrix
) {
  ctx.strokeStyle = coloe;
  const p = new Path2D();
  p.addPath(path, DOMMatrix.fromMatrix(m));
  ctx.stroke(p);
}

function testbase() {
  const clientWidth = window.innerWidth;
  const clientHeight = window.innerHeight;
  canvas.setAttribute("width", `${clientWidth * devicePixelRatio}px`);
  canvas.setAttribute("height", `${clientHeight * devicePixelRatio}px`);
  canvas.style.width = `${clientWidth}px`;
  canvas.style.height = `${clientHeight}px`;
  canvas.style.border = "1px #000 solid";

  return canvas.getContext("2d") as CanvasRenderingContext2D;
}
function myTest() {
  const ctx = testbase();

  const r1 = new Rect({
    leftTop: { x: 50, y: 50 },
    rightBottom: { x: 150, y: 150 },
  });

  const p1 = UtilTools.minRectToPath(r1);
  draw(ctx, p1, "red");

  const p2 = new Path2D();

  const sm = UtilTools.scale({ x: 1, y: 1 }, { x: 100, y: 100 }, r1);
  const rm = UtilTools.rotate(r1.centerPoint, { x: 10, y: 10 });
  sm.multiplySelf(rm);
  console.log("sm", sm.toString());

  p2.addPath(p1, sm);
  draw(ctx, p2, "blue");

  const p22 = new Path2D();
  const sm1 = UtilTools.scale({ x: 1, y: 1 }, { x: 100, y: 100 }, r1);
  console.log("sm1", sm1.toString());

  p22.addPath(p2, sm1);
  draw(ctx, p22, "green");

  const p11 = new Path2D();
  const m11 = DOMMatrix.fromMatrix(sm).multiplySelf(sm1);
  p11.addPath(p1, m11);
  console.log("m11", m11.toString());
  draw(ctx, p11, "#000");
}

function getTransition(prev: Rect, next: Rect): DOMMatrix {
  const angle = UtilTools.getAngle(next.centerPoint, prev.centerPoint);

  return new DOMMatrix();
}

drawGrid();
// develop();
myTest();
