import { Board, ToolsEnum } from ".";
import { ImageShape } from "./shape/image";

const canvas = document.createElement("canvas");
const grid = document.createElement("canvas");
const tools = document.createElement("ul");
const p = document.createElement("p");
document.body.append(grid, canvas, p, tools);

const gridCtx = grid.getContext("2d") as CanvasRenderingContext2D;
function drawGrid() {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  grid.setAttribute("width", `${innerWidth * devicePixelRatio}px`);
  grid.setAttribute("height", `${innerHeight * devicePixelRatio}px`);
  grid.style.width = `${innerWidth}px`;
  grid.style.height = `${innerHeight}px`;
  grid.style.position = "absolute";

  const style1 = "#ff000050";
  const style2 = "#00000050";
  const style3 = "#00000020";

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
drawGrid();
// const clientWidth = 600;
// const clientHeight = 600;
// canvas.setAttribute("width", `${clientWidth * devicePixelRatio}px`);
// canvas.setAttribute("height", `${clientHeight * devicePixelRatio}px`);
// canvas.style.width = `${clientWidth}px`;
// canvas.style.height = `${clientHeight}px`;
// canvas.style.border = "1px red solid";

// const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

// ctx.isPointInStroke
// const point = new Path2D();
// point.arc(300, 300, 1, 0, 2 * Math.PI);
// const base = new Path2D();
// base.arc(300, 300, 100, 0, 2 * Math.PI);

// function baseshape() {
//   ctx.strokeStyle = "#000";
//   ctx.stroke(point);
//   ctx.strokeStyle = "red";
//   ctx.stroke(base);
// }

// function lineToMouse(x: number, y: number) {
//   const dynamic = new Path2D();
//   dynamic.moveTo(300, 300);
//   dynamic.lineTo(x, y);
//   ctx.stroke(dynamic);
// }

// function rotateshape(x: number, y: number) {
//   const angle = (Math.atan2(y - 300, x - 300) * 180) / Math.PI;
//   const path = new Path2D();
//   path.rect(300, 300, 100, 100);
//   ctx.strokeStyle = "blue";
//   ctx.stroke(path);
//   const rotate = new Path2D();
//   rotate.addPath(
//     path,
//     new DOMMatrix().translate(350, 350).rotate(angle).translate(-350, -350)
//   );
//   ctx.strokeStyle = "green";

//   ctx.stroke(rotate);
// }
// window.addEventListener("mousemove", function (event) {
//   const x = event.x,
//     y = event.y;
//   console.log({ x, y });
//   ctx.clearRect(0, 0, clientWidth, clientHeight);
//   baseshape();
//   lineToMouse(x, y);
//   rotateshape(x, y);
// });

const src = "https://i.imgur.com/yBcdym6.jpeg";

const board = new Board(canvas);
initialTools();

const img = new ImageShape("test-image", board, src);

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
  board.toolsCtrl.switchTypeToPencil();
  p.innerText = `目前工具：鉛筆`;
  AddTools(ToolsEnum.鉛筆);
  AddTools(ToolsEnum.選擇器);
  AddTools(ToolsEnum.擦子);
}
