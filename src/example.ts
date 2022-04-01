import { Board, ToolsEnum } from ".";
const canvasId = "myCanvas";
const toolsId = "myTools";
const tipId = "status";
const canvas = document.getElementById(canvasId);
const tools = document.getElementById(toolsId);
const tipText = document.getElementById(tipId);
if (canvas && tools) {
  const board = new Board(canvas);
  board.toolsCtrl.switchTypeToPencil();
  if (tipText) {
    (tipText as HTMLParagraphElement).innerText = `預設狀態: 鉛筆`;
  }
  for (const index in tools.children) {
    const element = tools.children[index] as HTMLLIElement;
    if (element) {
      const type = element.id === "" ? null : (element.id as ToolsEnum);
      if (type) {
        element.addEventListener("click", () => {
          board.toolsCtrl.switchTypeTo(type);
          if (tipText) {
            (
              tipText as HTMLParagraphElement
            ).innerText = `已選擇:${element.innerText}`;
          }
        });
      }
    }
  }
}
