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
} from ".";

const canvas = document.createElement("canvas");
const grid = document.createElement("canvas");
const tools = document.createElement("ul");
const p = document.createElement("p");
const src = "https://i.imgur.com/m5c8KGt.jpeg";
const pdfsrc =
  "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf";
const gridCtx = grid.getContext("2d") as CanvasRenderingContext2D;

const fakePdf: PdfData = {
  objecturl: pdfsrc,
  objectid: "w_406015b3-14e1-42c5-be40",
  tools: "pdf",
  type: "confirmobject",
  x1: "564",
  y1: "136",
  width: "1024",
  height: "792",
  pagenumber: "1",
  application: "TeamShare Preproduction",
  request_datetime: "2022-06-21T01:55:59",
  wbid: "wb202204110850301SXIIglv7Q",
  pageid: "pg202204110850306N57UoQZEV",
  teamid: "wb202204110850301SXIIglv7Q",
  accountid: "96172c6e-7ab5-48e3-8656-e77c5dee1354",
  transform:
    "0.3276638415638503,0.0,282.24188109562317,0.0,0.3276638415638503,426.5934059065347,0.0,0.0,1.0",
  socketid: "7n4CLPNxE-y6PSe8AAAF",
};

const fakeImage: ImageData = {
  objecturl: src,
  objectid: "w_a552ffbf-cc75-4f62-b33a",
  tools: "image",
  type: "confirmobject",
  x1: "0",
  y1: "-198",
  width: "1920",
  height: "1280",
  application: "TeamShare Preproduction",
  request_datetime: "2022-06-21T01:55:46",
  wbid: "wb202204110850301SXIIglv7Q",
  pageid: "pg202204110850306N57UoQZEV",
  teamid: "wb202204110850301SXIIglv7Q",
  accountid: "96172c6e-7ab5-48e3-8656-e77c5dee1354",
  transform:
    "0.18015437495431605,0.0,452.29945734047203,0.0,0.18015437495431605,221.73341292915825,0.0,0.0,1.0",
  socketid: "7n4CLPNxE-y6PSe8AAAF",
};

const fakePen: PenData = {
  objectid: "w_2bcb67cd-4c18-4de9-aca5",
  tools: "pen",
  type: "confirmobject",
  children: [
    {
      x: "921",
      y: "300.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "300.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "300.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "300.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "300.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "301.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
    {
      x: "921",
      y: "300.015625",
      parentid: "w_2bcb67cd-4c18-4de9-aca5",
      tools: "pen",
    },
  ],
  linewidth: "12",
  linecolor: "#000000",
  lineopacity: "ff",
  application: "TeamShare Preproduction",
  request_datetime: "2022-06-08T09:15:15",
  wbid: "wb202204110850301SXIIglv7Q",
  pageid: "pg202204110850306N57UoQZEV",
  teamid: "wb202204110850301SXIIglv7Q",
  accountid: "960acf57-285c-47ad-801b-5128e45db100",
  transform:
    "223.60000000000014,0.0,-205014.60000000012,0.0,223.60000000000014,-66894.77812500004,0.0,0.0,1.0",
  socketid: "BmqFu7DSo6pu92lyAABT",
};

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

  const pdf = toPdfShape(fakePdf, board);
  board.addShapeByBs(pdf);
  const image = toImageShape(fakeImage, board);
  board.addShapeByBs(image);

  const pen = toBaseShape(fakePen, board);
  board.addShapeByBs(pen);

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
    board.toolsCtrl.switchTypeToViewer();
    p.innerText = `目前工具： 觀察者`;
    AddTools(ToolsEnum.觀察者);
    AddTools(ToolsEnum.鉛筆);
    AddTools(ToolsEnum.選擇器);
    AddTools(ToolsEnum.擦子);
  }
}

function toImageShape(data: ImageData, board: Board): ImageShape {
  const image = new ImageShape(data.objectid, board, data.objecturl, {
    x: parseInt(data.x1),
    y: parseInt(data.y1),
    width: parseInt(data.width),
    height: parseInt(data.height),
    transform: getMatrix(data.transform),
  });
  return image;
}

function toPdfShape(data: PdfData, board: Board): PDFShape {
  const pdf = new PDFShape(data.objectid, board, data.objecturl, {
    x: parseInt(data.x1),
    y: parseInt(data.y1),
    width: parseInt(data.width),
    height: parseInt(data.height),
    transform: getMatrix(data.transform),
  });
  return pdf;
}

function toBaseShape(data: PenData, board: Board): BaseShape {
  const p = new Path2D(),
    [p1, ...ps] = data.children,
    s: Styles = {
      lineColor: data.linecolor,
      lineWidth: parseInt(data.linewidth),
      lineDash: [],
    },
    x = parseInt(p1.x),
    y = parseInt(p1.y),
    matrix = getMatrix(data.transform);
  let minRect: MinRectVec = {
    leftTop: { x, y },
    rightBottom: { x, y },
  };

  p.moveTo(x, y);

  ps.forEach((point) => {
    const x = parseInt(point.x);
    const y = parseInt(point.y);
    p.lineTo(x, y);
    minRect = UtilTools.newMinRect({ x, y }, minRect);
  });

  const bs = new BaseShape(
    data.objectid,
    board,
    p,
    s,
    new Rect(minRect),
    matrix
  );
  return bs;
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
