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
    p.innerText = `目前工具：選擇器`;
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

  const rect = new Rect({
    leftTop: { x: 99, y: 100 },
    rightBottom: { x: 150, y: 151 },
  });

  const moveStart = { x: 0, y: 0 };
  const moveEnd = { x: 100, y: 100 };
  const scaleStart = { x: 0, y: 0 };
  const scaleEnd = { x: 100, y: 100 };
  const rotateStart = { x: 0, y: 0 };
  const rotateEnd = { x: 3, y: 4 };
  const basePath = UtilTools.minRectToPath(rect);
  draw(ctx, basePath, "red");

  const s = UtilTools.scale(scaleStart, scaleEnd, rect);
  const r = UtilTools.rotate(rect.centerPoint, rotateEnd);
  const t = UtilTools.translate(moveStart, moveEnd);

  const initMatrix = new DOMMatrix()
    .multiplySelf(t)
    .multiplySelf(r)
    .multiplySelf(s);

  console.log(initMatrix.toString());
  console.log(t.toString());

  // const rect2 = rect.clone().transferSelf(initMatrix);
  // const m1 = getMathMatrix(rect);
  // const m = getMathMatrix(rect2);
}

function myTest2() {
  const ctx = testbase();
  const m = new DOMMatrix();
  const rect = new Rect({
    leftTop: { x: 100, y: 100 },
    rightBottom: { x: 200, y: 200 },
  });
  const p = UtilTools.minRectToPath(rect);
  const drawBase = () => {
    ctx.strokeStyle = "red";
    ctx.stroke(p);
  };
  drawBase();

  let start = { x: 0, y: 0 };

  window.addEventListener("mousedown", (event) => {
    const { clientX, clientY } = event;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    start.x = clientX;
    start.y = clientY;
    drawBase();
  });
  window.addEventListener("mouseup", (event) => {
    const { clientX: x, clientY: y } = event;
    const end = { x, y };
    const np = new Path2D();
    np.addPath(p, UtilTools.scale(start, end, rect));
    ctx.strokeStyle = "blue";
    ctx.stroke(np);
  });
}

function pdfTest() {
  const ctx = testbase();

  const task = pdfjsLib.getDocument(pdfsrc);
  task.promise.then(
    function (pdf) {
      console.log("PDF loaded");

      // Fetch the first page
      var pageNumber = 1;
      pdf.getPage(pageNumber).then(function (page) {
        console.log("Page loaded");

        var scale = 1;
        var viewport = page.getViewport({ scale: scale });

        // Prepare canvas using PDF page dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas ctx
        var renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        var renderTask = page.render(renderContext);
        renderTask.promise.then(function () {
          console.log("Page rendered");
        });
      });
    },
    function (reason) {
      // PDF loading error
      console.error(reason);
    }
  );
}

drawGrid();
develop();
// myTest();
// myTest2();
// pdfTest();
function getMathMatrix(rect: Rect) {
  const p1 = rect.nw,
    p2 = rect.se;
  return math.matrix([
    [p1.x, p2.x],
    [p1.y, p2.y],
  ]);
}

// (() => {
//   const ctx = testbase();

//   const input = document.createElement("input");
//   const fileReader = new FileReader();
//   fileReader.onload = function () {
//     const typedArray = this.result;
//     if (typeof typedArray === "string") {
//       const ctx = testbase();

//       const task = pdfjsLib.getDocument(typedArray);
//       task.promise.then(
//         function (pdf) {
//           console.log("PDF loaded");

//           // Fetch the first page
//           var pageNumber = 1;
//           pdf
//             .getPage(pageNumber)
//             .then(function (page) {
//               console.log("Page loaded");

//               var scale = 1;
//               var viewport = page.getViewport({ scale: scale });

//               // Prepare canvas using PDF page dimensions
//               canvas.height = viewport.height;
//               canvas.width = viewport.width;

//               // Render PDF page into canvas ctx
//               var renderContext = {
//                 canvasContext: ctx,
//                 viewport: viewport,
//               };
//               var renderTask = page.render(renderContext);
//               renderTask.promise.then(function () {
//                 console.log("Page rendered");
//               });
//             })
//             .catch((e) => {
//               console.log("first", e);
//             });
//         },
//         function (reason) {
//           // PDF loading error
//           console.error("reason", reason);
//         }
//       );
//     }
//   };

//   input.type = "file";
//   input.width = 100;
//   input.height = 30;
//   input.addEventListener("change", function (event) {
//     if (this.files) {
//       const file = this.files[0];
//       if (file.type != "application/pdf") {
//         throw new Error(`${file.name}, is not a pdf file.`);
//       }

//       fileReader.readAsDataURL(file);
//     }
//   });

//   document.body.append(input);
// })();
