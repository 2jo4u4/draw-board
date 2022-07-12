import {
  Board,
  Rect,
  ToolsEnum,
  UtilTools,
  BaseShape,
  ImageShape,
  PDFShape,
  ImageData,
  PdfData,
  PenData,
  Styles,
  MinRectVec,
  Socket,
} from ".";

const canvas = document.createElement("canvas");
const grid = document.createElement("canvas");
const tools = document.createElement("ul");
tools.style.position = "absolute";
tools.style.top = "0px";
const gridCtx = grid.getContext("2d") as CanvasRenderingContext2D;

const src = "https://i.imgur.com/m5c8KGt.jpeg";
const fakeImage: ImageData = {
  objecturl: src,
  objectid: "w_a552ffbf-cc75-4f62-b33a",
  x1: 0,
  y1: 0,
  width: 1920,
  height: 1280,
  pageid: "pg202204110850306N57UoQZEV",
  transform: new DOMMatrix().scaleSelf(0.13, 0.13),
};

function drawGrid() {
  document.body.append(grid, canvas, tools);
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
declare global {
  interface Window {
    socket: Socket;
    board: Board;
    openPageRoll: () => void;
  }
}
function develop() {
  const socket = new Socket(canvas);
  const board = socket.board;
  window["socket"] = socket;

  // const board = new Board(canvas);
  // window["board"] = board;

  const manager = board.localManager;
  initialTools();
  initialPreview();

  window["openPageRoll"] = openPageRoll;
  const image = new ImageShape(fakeImage.objectid, board, fakeImage.objecturl, {
    x: fakeImage.x1,
    y: fakeImage.y1,
    width: fakeImage.width,
    height: fakeImage.height,
    transform: fakeImage.transform,
  });
  manager.addBaseShape(image);

  let isOpen = false;
  let close: () => void;
  function openPageRoll() {
    if (isOpen) {
      close();
      openPageRoll();
      return;
    }
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.bottom = "30px";
    div.style.left = "30px";
    div.style.background = "#ffffff";
    socket.pageRollArray.forEach(([pageid, pg]) => {
      if (pg.HTMLElement) {
        pg.HTMLElement.style.border = "1px red solid";
        pg.HTMLElement.style.width = "200px";
        pg.HTMLElement.style.height = "100px";
        div.append(pg.HTMLElement);
      }
    });
    socket.pageRollIsFreeze = false;
    document.body.append(div);
    isOpen = true;
    close = () => {
      isOpen = false;
      div.remove();
    };
  }

  (function () {
    const undo = document.createElement("button");
    const redo = document.createElement("button");
    const clearAll = document.createElement("button");
    undo.innerText = "上一步";
    undo.onclick = () => {
      manager.undo();
    };
    redo.innerText = "下一步";
    redo.onclick = () => {
      manager.redo();
    };
    clearAll.innerText = "清除";
    clearAll.onclick = () => {
      manager.clearAllPageShape();
    };
    tools.append(undo, redo, clearAll);
  })();

  function AddTools(v: ToolsEnum) {
    const child = document.createElement("li");
    const text =
      Object.entries(ToolsEnum).find(([key, val]) => val === v)?.[0] ||
      "未定義工具";
    child.innerText = text;
    child.addEventListener("click", () => {
      manager.switchTypeTo(v);
    });
    tools.appendChild(child);
  }

  function initialTools() {
    tools.style.cursor = "pointer";
    board.localManager.switchTypeToViewer();
    AddTools(ToolsEnum.觀察者);
    AddTools(ToolsEnum.鉛筆);
    AddTools(ToolsEnum.選擇器);
    AddTools(ToolsEnum.擦子);
  }

  function initialPreview() {
    const preview = document.createElement("div");
    const canvas = document.createElement("canvas");
    const tool = document.createElement("div");
    const button = document.createElement("button");
    button.textContent = "Preview Toogle";
    tool.append(button);

    preview.append(canvas, tool);
    preview.classList.add("previewRoot");
    preview.style.display = "flex";
    preview.style.justifyContent = "center";
    tool.style.position = "absolute";
    tool.style.bottom = "0";

    document.body.append(preview);

    board.initialPreview(canvas, {});
    initialMask(button);
  }

  function initialMask(button: HTMLButtonElement) {
    board.previewCtrl.initialMask();
    const { previewCtrl: previewWindow } = board;
    button.onclick = () => previewWindow.toggle();
  }
}

function getMatrix(t: string) {
  const [a = 1, c = 0, e = 0, b = 0, d = 1, f = 0] = t
    .split(",")
    .map((s) => parseFloat(s));

  return new DOMMatrix([a, b, c, d, e, f]);
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

drawGrid();
develop();
// myTest();
