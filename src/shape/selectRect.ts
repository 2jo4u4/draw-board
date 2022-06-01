import { BaseShape } from ".";
import { Board, defaultSolidboxStyle, padding, UtilTools } from "..";
import trash from "../assets/trash-bin-svgrepo-com.svg";
import rotate from "../assets/redo-svgrepo-com.svg";

/** 特殊圖形，用以畫出被選擇的圖形框 */
export class SelectSolidRect extends BaseShape {
  readonly $type;
  readonly actionBar: ActionBar;
  /** 紀錄被選取的圖形 */
  shapes: BaseShape[] = [];

  constructor(board: Board) {
    super("selectRect_onlyOne", board, new Path2D(), defaultSolidboxStyle, {
      rightBottom: { x: 0, y: 0 },
      leftTop: { x: 0, y: 0 },
    });
    this.$type = "selectSolid-shape";
    this.actionBar = new ActionBar(board, this, ["delete", "rotate"]);
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: MinRectVec) {
    this.setting(mrv);
    const s = this.style,
      p = this.bindingBox;
    this.board.rerenderToEvent({ bs: { s, p } });
    this.actionBar.openBar(mrv);
  }

  /** 設定路徑 及 矩形 */
  setting(mrv: MinRectVec) {
    this.minRect = mrv;
    this.settingPath(UtilTools.minRectToPath(mrv, padding));
    this.shapes = Array.from(this.board.shapes)
      .filter((bs) => !bs[1].isDelete && bs[1].isSelect)
      .map((bs) => bs[1]);
  }

  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    this.actionBar.closeBar();
    this.settingPath();
  }

  override moveStart(v: Vec2): void {
    this.shapes.forEach((bs) => {
      bs.moveStart(v);
    });
    super.moveStart(v);
  }

  override move(v: Vec2): void {
    this.board.clearCanvas("event");
    this.shapes.forEach((bs) => {
      bs.move(v);
    });
    this.actionBar.move(this.getOffset(this.regPosition, v));
    super.move(v);
  }

  override moveEnd(v: Vec2): void {
    this.board.clearCanvas("event");
    this.shapes.forEach((bs) => {
      bs.moveEnd(v);
    });
    super.moveEnd(v);
  }

  private settingPath(p?: Path2D) {
    if (p) {
      this.path = p;
      this.bindingBox = p;
    } else {
      const path = new Path2D();
      this.path = path;
      this.bindingBox = path;
    }
  }
}

const interval = 60; //px
type ActionBarTools = "delete" | "rotate";

/**
 * 選取後的控制欄位
 */
class ActionBar {
  readonly board: Board;
  readonly solidRect: SelectSolidRect;

  private rootBlock: HTMLDivElement;
  private block: HTMLDivElement;
  private openFlag = false;

  constructor(board: Board, ssr: SelectSolidRect, use: ActionBarTools[]) {
    this.board = board;
    this.solidRect = ssr;
    this.rootBlock = board.rootBlock;
    this.block = document.createElement("div");
    this.initial(use);
  }

  private initial(use: ActionBarTools[]) {
    this.block.style.position = "absolute";
    this.block.style.border = "1px solid red";
    this.icon(use);
  }

  move(offset: [number, number]) {
    this.block.style.top = `${
      parseInt(this.block.style.top) + offset[1] / this.board.decivePixelPatio
    }px`;
    this.block.style.left = `${
      parseInt(this.block.style.left) + offset[0] / this.board.decivePixelPatio
    }px`;
  }

  openBar(mrv: MinRectVec) {
    if (!this.openFlag) {
      this.openFlag = true;
      const {
        leftTop: { x: x1, y: y1 },
        rightBottom: { x: x2, y: y2 },
      } = mrv;
      const width = x2 - x1 + padding * 2 + defaultSolidboxStyle.lineWidth * 2;
      this.block.style.top = `${y1 / this.board.decivePixelPatio - interval}px`;
      this.block.style.left = `${
        (x1 - padding - defaultSolidboxStyle.lineWidth) /
        this.board.decivePixelPatio
      }px`;
      this.block.style.width = `${width / this.board.decivePixelPatio}px`;
      this.rootBlock.append(this.block);
    }
  }

  closeBar() {
    if (this.openFlag) {
      this.openFlag = false;
      this.block.remove();
    }
  }

  private icon(type: ActionBarTools[]) {
    [...new Set(type)].forEach((item) => {
      let btn!: HTMLImageElement;
      switch (item) {
        case "delete":
          btn = this.generateBtn(trash);
          btn.onclick = () => {
            this.board.deleteShape();
            this.solidRect.closeSolidRect();
          };
          break;
        case "rotate":
          btn = this.generateBtn(rotate);
          btn.onclick = () => {
            console.log("rotate");
          };
          break;
      }
      this.block.append(btn);
    });
  }

  private generateBtn(src: string) {
    const img = new Image(24, 24);
    img.style.cursor = "pointer";
    img.src = src;
    return img;
  }
}
