import {
  Board,
  ToolsEnum,
  ImageShape,
  PDFShape,
  ImageData,
  PdfData,
  Socket,
} from ".";

console.clear();

const canvas = document.createElement("canvas");
const grid = document.createElement("canvas");
const tools = document.createElement("ul");
tools.style.position = "absolute";
tools.style.top = "0px";
const gridCtx = grid.getContext("2d") as CanvasRenderingContext2D;

const src = "https://i.imgur.com/m5c8KGt.jpeg";
const pdfsrc =
  "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf";
const fakeImage: ImageData = {
  objecturl: src,
  objectid: "image-asdwdwd",
  x1: 0,
  y1: 0,
  width: 1920,
  height: 1280,
  transform: new DOMMatrix().scaleSelf(0.13, 0.13),
};

const fakePDF: PdfData = {
  objecturl: pdfsrc,
  objectid: "pdf-dfefdc",
  x1: 200,
  y1: 200,
  width: 1920,
  height: 1280,
  transform: new DOMMatrix(),
  pagenumber: 1,
};

function drawGrid() {
  document.body.append(grid, canvas, tools);
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  grid.setAttribute("width", `${innerWidth * devicePixelRatio}px`);
  grid.setAttribute("height", `${innerHeight * devicePixelRatio}px`);
  grid.style.width = `${innerWidth}px`;
  grid.style.height = `${innerHeight}px`;
  grid.style.position = "absolute";

  const style = "#ff0000";
  const style1 = "#ff000030";
  const style2 = "#00000030";
  const style3 = "#00000010";

  for (let x = 0; x < innerWidth * devicePixelRatio; x += 10) {
    if (x % 200 === 0) {
      gridCtx.strokeStyle = style;
    } else if (x % 100 === 0) {
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
    if (y % 200 === 0) {
      gridCtx.strokeStyle = style;
    } else if (y % 100 === 0) {
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
  socket.board.zoom = { x: 0, y: 150, k: 3 };
  // const board = new Board(canvas);
  // window["board"] = board;

  const manager = board.localManager;
  initialTools();
  initialPreview();

  window["openPageRoll"] = openPageRoll;
  // const image = new ImageShape(fakeImage.objectid, board, fakeImage.objecturl, {
  //   x: fakeImage.x1,
  //   y: fakeImage.y1,
  //   width: fakeImage.width,
  //   height: fakeImage.height,
  //   transform: fakeImage.transform,
  // });
  // manager.addBaseShape(image);

  // const pdf = new PDFShape(fakePDF.objectid, board, fakePDF.objecturl, {
  //   x: 200,
  //   y: 200,
  //   width: 300,
  //   height: 300,
  //   transform: fakePDF.transform,
  //   fileName: "helloworld",
  // });
  // manager.addBaseShape(pdf);

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
    undo.innerText = "上一步";
    undo.onclick = () => {
      manager.undo();
    };

    const redo = document.createElement("button");
    redo.innerText = "下一步";
    redo.onclick = () => {
      manager.redo();
    };

    const clearAll = document.createElement("button");
    clearAll.innerText = "清除";
    clearAll.onclick = () => {
      manager.clearAllPageShape();
    };

    const inputFile = document.createElement("input");
    inputFile.type = "file";
    inputFile.addEventListener("change", function () {
      const file = this.files ? this.files[0] : undefined;
      if (file) {
        manager.importFile(file);
      }
    });

    tools.append(undo, redo, clearAll, inputFile);
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

drawGrid();
develop();
