import { Board, dashedLine, defaultStyle, padding, UtilTools } from "..";
import trash from "../assets/trash-bin-svgrepo-com.svg";
import rotate from "../assets/redo-svgrepo-com.svg";

const defaultSolidboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000080",
  lineDash: dashedLine,
};
/**
 * 圖形基本類
 */
export class BaseShape {
  readonly $type = "base-shape";
  readonly id: string;
  readonly board: Board;
  readonly actionBar: ActionBar;
  /** 圖形路徑 */
  path: Path2D;
  /** 樣式 */
  style: Styles;
  /** 紀錄一個路徑的最小包覆矩形 */
  minRect: MinRectVec = {
    leftTop: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
  };
  /** 判斷是否被選取的路徑 */
  solidRectPath: Path2D;
  /** 是否被選取 */
  isSelect = false;

  constructor(
    id: string,
    board: Board,
    path: Path2D,
    style: Styles,
    minRect: MinRectVec
  ) {
    this.id = id;
    this.board = board;
    this.path = new Path2D(path);
    this.style = Object.assign(defaultStyle, style);
    this.minRect = minRect;
    const {
      leftTop: { x: sX, y: sY },
      rightBottom: { x: eX, y: eY },
    } = minRect;
    this.solidRectPath = new Path2D();
    // 稍微加大範圍
    this.solidRectPath.rect(
      sX - padding,
      sY - padding,
      eX - sX + padding * 2,
      eY - sY + padding * 2
    );
    this.actionBar = new ActionBar(board, this, ["delete", "rotate"]);
  }

  openSolidRect(config?: { mrv?: MinRectVec; openBar?: boolean }) {
    const _config = Object.assign({}, config);
    if (!this.isSelect) {
      this.isSelect = true;
      this.onSolidBoxStart();
      if (config) {
        if (_config.mrv) {
          this.board.ctx.stroke(
            UtilTools.drawMinRectVecPath(_config.mrv, padding)
          );
        } else {
          this.board.ctx.stroke(this.solidRectPath);
        }
        config.openBar && this.actionBar.openBar(_config.mrv);
      }
    }
  }
  closeSolidRect() {
    if (this.isSelect) {
      this.isSelect = false;
      this.actionBar.closeBar();
      // todo
    }
  }

  /** 選取固定框設定 */
  private onSolidBoxStart() {
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

  openBar(mrv?: MinRectVec) {
    if (!this.openFlag) {
      this.openFlag = true;
      const {
        leftTop: { x: x1, y: y1 },
        rightBottom: { x: x2, y: y2 },
      } = mrv || this.baseShape.minRect;
      const width = x2 - x1 + padding * 2 + defaultSolidboxStyle.lineWidth * 2;
      this.block.style.top = `${y1 - interval}px`;
      this.block.style.left = `${
        x1 - padding - defaultSolidboxStyle.lineWidth
      }px`;
      this.block.style.width = `${width}px`;
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
