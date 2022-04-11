import { Board, ToolsEnum } from ".";

const canvas = document.createElement("canvas");
const tools = document.createElement("ul");
const p = document.createElement("p");
const body = document.body;
const board = new Board(canvas);
initialTools();

body.appendChild(canvas);
body.appendChild(p);
body.appendChild(tools);

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
}
