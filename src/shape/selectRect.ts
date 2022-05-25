import { BaseShape } from ".";
import { Board, dashedLine, padding, UtilTools } from "..";
import trash from "../assets/trash-bin-svgrepo-com.svg";
import rotate from "../assets/redo-svgrepo-com.svg";

const defaultSolidboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000080",
  lineDash: dashedLine,
  fillColor: undefined,
};

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
    this.actionBar = new ActionBar(board, this, ["delete"]);
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: MinRectVec, ...bsArray: BaseShape[]) {
    this.setting(mrv, ...bsArray);
    this.draw();
    this.openSolidRect(mrv);
  }

  /** 設定路徑 及 矩形 */
  setting(mrv: MinRectVec, ...bsArray: BaseShape[]) {
    this.minRect = mrv;
    this.settingPath(UtilTools.minRectToPath(mrv, padding));
    this.shapes = bsArray;
  }

  /** 畫出最小矩形 並 打開控制欄位 */
  openSolidRect(mrv: MinRectVec) {
    this.settingCtx();
    this.actionBar.openBar(mrv);
  }
  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    this.actionBar.closeBar();
    this.settingPath();
  }

  override moveStart(v: Vec2): void {
    // 提取將被移動的圖形至事件層級
    this.board.clearCanvas();
    this.board.shapes.forEach((bs) => {
      if (bs.isSelect) {
        bs.moveStart(v);
      } else {
        this.board.drawByBs(bs);
      }
    });
    this.draw();
    super.moveStart(v);
  }

  override move(v: Vec2): void {
    // 在事件層移動圖形
    this.board.clearCanvas("event");
    this.shapes.forEach((bs) => {
      bs.move(v);
    });
    this.actionBar.move(this.getOffset(this.regPosition, v));
    super.move(v);
    this.draw();
  }

  override moveEnd(v: Vec2): void {
    // 將圖形放回圖層級
    this.board.clearCanvas();
    this.shapes.forEach((bs) => {
      bs.moveEnd(v);
    });
    super.moveEnd(v);
    this.board.shapes.forEach((bs) => {
      this.board.drawByBs(bs);
    });
    this.draw();
  }

  /** 畫出框框 */
  private draw() {
    UtilTools.injectStyle(this.board.ctx, this.style);
    this.board.ctx.stroke(this.bindingBox);
  }

  private settingPath(p?: Path2D) {
    if (p) {
      this.bindingBox = p;
    } else {
      const path = new Path2D();
      this.bindingBox = path;
    }
  }

  /** 選取固定框設定 */
  private settingCtx() {
    UtilTools.injectStyle(this.board.ctx, defaultSolidboxStyle);
  }
}

const interval = 60; //px
type ActionBarTools = "delete" | "rotate";

/**
 * 選取後的控制欄位
 */
class ActionBar {
  readonly board: Board;
  readonly baseShape: BaseShape;

  private rootBlock: HTMLDivElement;
  private block: HTMLDivElement;
  private openFlag = false;

  constructor(board: Board, bs: BaseShape, use: ActionBarTools[]) {
    this.board = board;
    this.baseShape = bs;
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
    type.forEach((item) => {
      let btn!: HTMLImageElement;
      switch (item) {
        case "delete":
          btn = this.generateBtn(trash);
          btn.onclick = () => {
            this.board.deleteShape();
            this.block.remove();
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
