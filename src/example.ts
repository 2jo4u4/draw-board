import { Board, ToolsEnum, UtilTools } from ".";
import { ImageShape } from "./shape/image";

const canvas = document.createElement("canvas");
const grid = document.createElement("canvas");
const tools = document.createElement("ul");
const p = document.createElement("p");
const src = "https://i.imgur.com/yBcdym6.jpeg";
const gridCtx = grid.getContext("2d") as CanvasRenderingContext2D;

function drawGrid() {
  document.body.append(grid, canvas, p, tools);
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

  develop();
}
function develop() {
  const board = new Board(canvas);
  initialTools();

  new ImageShape("test-image", board, src);

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
}

function myTest() {
  document.body.append(canvas, p, tools);
  const clientWidth = window.innerWidth;
  const clientHeight = window.innerHeight;
  canvas.setAttribute("width", `${clientWidth * devicePixelRatio}px`);
  canvas.setAttribute("height", `${clientHeight * devicePixelRatio}px`);
  canvas.style.width = `${clientWidth}px`;
  canvas.style.height = `${clientHeight}px`;
  canvas.style.border = "1px #000 solid";

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const img = new Image();
  img.src = src;
}

drawGrid();
// myTest();
