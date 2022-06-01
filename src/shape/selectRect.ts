import { BaseShape } from ".";
import { Board, defaultSolidboxStyle, padding, UtilTools, Rect } from "..";
import trash from "../assets/trash-bin-svgrepo-com.svg";
import rotate from "../assets/redo-svgrepo-com.svg";

type ActionFlag =
  | "move" // 移動
  | "rotate" // 旋轉
  | "nw-scale" // 縮放左上
  | "ne-scale" // 縮放右上
  | "sw-scale" // 縮放左下
  | "se-scale" // 縮放右下
  | null;

type ScalePoint = [Path2D, Path2D, Path2D, Path2D];
const defauletScalePoint: Styles = {
  lineColor: "red",
  lineWidth: 4,
  fillColor: "red",
};
const defauletRotatePoint: Styles = {
  lineColor: "blue",
  lineWidth: 4,
  fillColor: "blue",
};
/** 特殊圖形，用以畫出被選擇的圖形框 */
export class SelectSolidRect extends BaseShape {
  readonly $type;
  readonly actionBar: ActionBar;
  startPosition!: Vec2;
  shapes: BaseShape[] = [];
  scalePoint: ScalePoint;
  rotatePoint: Path2D;
  flag: ActionFlag;

  constructor(board: Board) {
    super("selectRect_onlyOne", board, new Path2D(), defaultSolidboxStyle, {
      rightBottom: { x: 0, y: 0 },
      leftTop: { x: 0, y: 0 },
    });
    this.$type = "selectSolid-shape";
    this.actionBar = new ActionBar(board, this, ["delete"]);

    this.rotatePoint = new Path2D();
    this.scalePoint = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    this.flag = null;
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: MinRectVec) {
    this.setting(mrv);
    this.actionBar.openBar(mrv);
  }

  /** 設定路徑 / 矩形 / 紀錄被選取的圖形 */
  setting(mrv: MinRectVec) {
    this.coveredRect = new Rect(mrv);
    this.settingBindingBox(UtilTools.minRectToPath(mrv, padding));
    const s = this.style,
      p = this.path;
    this.board.rerenderToEvent({ bs: { s, p } });
    this.settingRotateAndScale(mrv);
    this.shapes = Array.from(this.board.shapes)
      .filter((bs) => !bs[1].isDelete && bs[1].isSelect)
      .map((bs) => bs[1]);
  }

  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    this.actionBar.closeBar();
    this.settingBindingBox();
    this.shapes = [];
    this.flag = null;
    this.board.changeCursor("default");
  }

  isCovered(v: Vec2): boolean {
    let ans = true;
    if (this.board.checkPointInPath(this.rotatePoint, v)) {
      this.flag = "rotate";
      this.board.changeCursor("grab");
    } else if (this.board.checkPointInPath(this.scalePoint[0], v)) {
      this.flag = "nw-scale";
      this.board.changeCursor("nw-resize");
    } else if (this.board.checkPointInPath(this.scalePoint[1], v)) {
      this.flag = "ne-scale";
      this.board.changeCursor("ne-resize");
    } else if (this.board.checkPointInPath(this.scalePoint[2], v)) {
      this.flag = "sw-scale";
      this.board.changeCursor("sw-resize");
    } else if (this.board.checkPointInPath(this.scalePoint[3], v)) {
      this.flag = "se-scale";
      this.board.changeCursor("se-resize");
    } else if (this.board.checkPointInPath(this.path, v)) {
      this.flag = "move";
      this.board.changeCursor("move");
    } else {
      this.board.changeCursor("default");
      this.flag = null;
      ans = false;
    }

    return ans;
  }

  handleStart(v: Vec2) {
    console.log("start", v);

    this.startPosition = v;
    switch (this.flag) {
      case "move":
        // no need setting
        break;
      case "rotate":
        this.board.changeCursor("grabbing");
        break;
      case "nw-scale":
        break;
      case "ne-scale":
        break;
      case "sw-scale":
        break;
      case "se-scale":
      default:
        break;
    }
  }
  handleActive(v: Vec2) {
    switch (this.flag) {
      case "move":
        this.transfer(v, UtilTools.translate(this.startPosition, v));
        break;
      case "rotate":
        this.transfer(
          v,
          UtilTools.rotate(this.startPosition, v, this.coveredRect)
        );
        break;
      case "nw-scale":
        this.transfer(
          v,
          UtilTools.scale(
            v,
            this.startPosition,
            this.coveredRect.rightBottomPoint
          )
        );
        break;
      case "ne-scale":
        this.transfer(
          v,
          UtilTools.scale(
            { x: this.startPosition.x, y: v.y },
            { x: v.x, y: this.startPosition.y },
            this.coveredRect.leftBottomPoint
          )
        );
        break;
      case "sw-scale":
        this.transfer(
          v,
          UtilTools.scale(
            { x: v.x, y: this.startPosition.y },
            { x: this.startPosition.x, y: v.y },
            this.coveredRect.rightTopPoint
          )
        );
        break;
      case "se-scale":
        this.transfer(
          v,
          UtilTools.scale(this.startPosition, v, this.coveredRect.leftTopPoint)
        );
    }
  }
  handleInactive(v: Vec2) {
    if (this.shapes.length > 0) {
      this.isCovered(v);
    }
  }
  handleEnd(v: Vec2) {
    console.log("end", v);

    switch (this.flag) {
      case "move":
        this.transferEnd(
          UtilTools.translate(this.startPosition, v),
          "translate"
        );
        break;
      case "rotate":
        this.board.changeCursor("grab");
        this.transferEnd(
          UtilTools.rotate(this.startPosition, v, this.coveredRect),
          "rotate"
        );
        break;
      case "nw-scale":
        this.transferEnd(
          UtilTools.scale(
            v,
            this.startPosition,
            this.coveredRect.rightBottomPoint
          ),
          "scale"
        );
        break;
      case "ne-scale":
        this.transferEnd(
          UtilTools.scale(
            { x: this.startPosition.x, y: v.y },
            { x: v.x, y: this.startPosition.y },
            this.coveredRect.leftBottomPoint
          ),
          "scale"
        );
        break;
      case "sw-scale":
        this.transferEnd(
          UtilTools.scale(
            { x: v.x, y: this.startPosition.y },
            { x: this.startPosition.x, y: v.y },
            this.coveredRect.rightTopPoint
          ),
          "scale"
        );
        break;
      case "se-scale":
        this.transferEnd(
          UtilTools.scale(this.startPosition, v, this.coveredRect.leftTopPoint),
          "scale"
        );
    }
    this.flag = null;
  }

  override transfer(v: Vec2, matrix: DOMMatrix): void {
    this.board.clearCanvas("event");
    this.actionBar.closeBar();
    this.shapes.forEach((bs) => {
      bs.transfer(v, matrix);
    });
    super.transfer(v, matrix);
  }

  override transferEnd(matrix: DOMMatrix, type: ShapeActionType): void {
    this.board.clearCanvas("event");
    this.shapes.forEach((bs) => {
      bs.transferEnd(matrix, type);
    });
    super.transferEnd(matrix, type);
    this.actionBar.openBar(this.coveredRect.rectPoint);
  }

  /** 設定 path (bindingBox 於 特此類中 等價 path) */
  private settingBindingBox(p?: Path2D) {
    if (p) {
      this.path = p;
    } else {
      const path = new Path2D();
      this.path = path;
    }
  }

  /** 設定 縮放四點 / 旋轉點 */
  private settingRotateAndScale(mrv: MinRectVec) {
    const {
      leftTop: { x: x1, y: y1 },
      rightBottom: { x: x2, y: y2 },
    } = mrv;
    const fourCorner: Vec2[] = [
      { x: x1 - padding, y: y1 - padding }, // nw
      { x: x2 + padding, y: y1 - padding }, // sw
      { x: x1 - padding, y: y2 + padding }, // ne
      { x: x2 + padding, y: y2 + padding }, // sw
    ];

    fourCorner.forEach(({ x, y }, index) => {
      const p = new Path2D();
      p.arc(x, y, 8, 0, 2 * Math.PI);
      this.board.rerenderToEvent({
        bs: { p, s: defauletScalePoint },
      });
      this.scalePoint[index] = p;
    });

    const p = new Path2D();
    p.arc(x1 - 3 * padding, y2 + 3 * padding, 10, 0, 2 * Math.PI);
    this.board.rerenderToEvent({
      bs: { p, s: defauletRotatePoint },
    });
    this.rotatePoint = p;
  }

  private updateRotateAndScale(matrix: DOMMatrix, updata = false) {
    const newScalePoint = this.scalePoint.map((path) => {
      const newPath = new Path2D();
      newPath.addPath(path, matrix);
      this.board.rerenderToEvent({ bs: { p: newPath, s: defauletScalePoint } });
      return newPath;
    }) as ScalePoint;
    const rotatePoint = new Path2D();
    rotatePoint.addPath(this.rotatePoint, matrix);
    this.board.rerenderToEvent({
      bs: { p: rotatePoint, s: defauletRotatePoint },
    });

    if (updata) {
      this.rotatePoint = rotatePoint;
      this.scalePoint = newScalePoint;
    }
  }
}

const interval = 60; //px
type ActionBarTools = "delete";
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
    const [dx, dy] = offset;
    this.block.style.top = `${
      parseInt(this.block.style.top) + dy / this.board.devicePixelRatio
    }px`;
    this.block.style.left = `${
      parseInt(this.block.style.left) + dx / this.board.devicePixelRatio
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
      this.block.style.top = `${y1 / this.board.devicePixelRatio - interval}px`;
      this.block.style.left = `${
        (x1 - padding - defaultSolidboxStyle.lineWidth) /
        this.board.devicePixelRatio
      }px`;
      this.block.style.width = `${width / this.board.devicePixelRatio}px`;
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
