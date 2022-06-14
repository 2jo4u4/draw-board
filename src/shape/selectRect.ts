import { Board, defaultSolidboxStyle, padding, UtilTools, Rect } from "..";
import { BaseShape } from "./";
import trash from "../assets/trash-bin-svgrepo-com.svg";

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
  readonly canSelect: boolean;
  shapes: BaseShape[] = [];
  scalePath: ScalePoint;
  rotatePath: Path2D;
  flag: ShapeActionType | null;
  showCtrlPoint = false;

  override get bindingBox(): Path2D {
    return this.path;
  }
  override set bindingBox(p: Path2D) {
    this.path = p;
  }

  constructor(board: Board) {
    super(
      "selectRect_onlyOne",
      board,
      new Path2D(),
      defaultSolidboxStyle,
      new Rect()
    );
    this.$type = "selectSolid-shape";
    this.actionBar = new ActionBar(board, this, ["delete"]);
    this.canSelect = false;

    this.rotatePath = new Path2D();
    this.scalePath = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    this.flag = null;
  }

  /** 設定路徑\矩形\畫出框框, 並打開控制欄位 */
  settingAndOpen(mrv: Rect) {
    const clone = mrv.clone();
    this.coveredRect = clone;
    this.path = UtilTools.minRectToPath(this.coveredRect);

    this.showCtrlPoint = true;
    this.assignScale();
    this.assignRotate();

    this.shapes = Array.from(this.board.shapes)
      .filter((bs) => !bs[1].isDelete && bs[1].isSelect)
      .map((bs) => bs[1]);

    this.actionBar.openBar(clone);
  }

  /** 清除最小矩形 並 關閉控制欄位 */
  closeSolidRect() {
    this.showCtrlPoint = false;
    this.matrix = new DOMMatrix();
    this.actionBar.closeBar();
    this.clearAllPath();
    this.shapes = [];
    this.flag = null;
    this.board.changeCursor("default");
  }

  isCovered(v: Vec2): boolean {
    const nV = UtilTools.unZoomPosition(this.board.zoom, v);
    let ans = true;
    if (this.board.checkPointInPath(this.rotatePath, nV)) {
      this.flag = "rotate";
      this.board.changeCursor("grab");
    } else if (this.board.checkPointInPath(this.scalePath[0], nV)) {
      this.flag = "nw-scale";
      this.board.changeCursor("nw-resize");
    } else if (this.board.checkPointInPath(this.scalePath[1], nV)) {
      this.flag = "ne-scale";
      this.board.changeCursor("ne-resize");
    } else if (this.board.checkPointInPath(this.scalePath[2], nV)) {
      this.flag = "sw-scale";
      this.board.changeCursor("sw-resize");
    } else if (this.board.checkPointInPath(this.scalePath[3], nV)) {
      this.flag = "se-scale";
      this.board.changeCursor("se-resize");
    } else if (this.board.checkPointInPath(this.pathWithMatrix, v)) {
      this.flag = "translate";
      this.board.changeCursor("move");
    } else {
      this.board.changeCursor("default");
      this.flag = null;
      ans = false;
    }

    return ans;
  }

  handleStart(v: Vec2) {
    const m = new DOMMatrix();
    this.shapes.forEach((bs) => {
      bs.transferStart(v, m, this.flag);
    });
    super.transferStart(v, m, this.flag);
    switch (this.flag) {
      case "rotate":
        this.board.changeCursor("grabbing");
        break;
    }
  }
  handleActive(v: Vec2) {
    // const m = this.conputerMatrix(v, this.flag);
    const m = new DOMMatrix();
    this.transfer(v, m, this.flag);
    switch (this.flag) {
      case "translate":
        {
          const { x, y } = UtilTools.unZoomPosition(
            this.board.zoom,
            this.startPosition
          );
          const { x: nX, y: nY } = UtilTools.unZoomPosition(this.board.zoom, v);
          // const matrix = UtilTools.translate(this.startPosition, v);
          const matrix = UtilTools.translate({ x, y }, { x: nX, y: nY });
          this.transfer(v, matrix, this.flag);
        }
        break;
      case "rotate":
        {
          const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
          const matrix = UtilTools.rotate(
            this.coveredRect.centerPoint,
            { x, y }, //v,
            // this.initDegree
            0
          );
          this.transfer(v, matrix, this.flag);
        }
        break;
      case "nw-scale":
        {
          const { x: nX, y: nY } = UtilTools.unZoomPosition(
            this.board.zoom,
            this.startPosition
          );
          const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
          const matrix = UtilTools.scale(
            v,
            this.startPosition,
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transfer({ x, y }, matrix, this.flag);
        }
        break;
      case "ne-scale":
        {
          const matrix = UtilTools.scale(
            { x: this.startPosition.x, y: v.y },
            { x: v.x, y: this.startPosition.y },
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transfer(v, matrix, this.flag);
        }
        break;
      case "sw-scale":
        {
          const matrix = UtilTools.scale(
            { x: v.x, y: this.startPosition.y },
            { x: this.startPosition.x, y: v.y },
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transfer(v, matrix, this.flag);
        }
        break;
      case "se-scale":
        {
          const matrix = UtilTools.scale(
            this.startPosition,
            v,
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transfer(v, matrix, this.flag);
        }
        break;
    }
  }
  handleInactive(v: Vec2) {
    if (this.shapes.length > 0) {
      this.isCovered(v);
    }
  }
  handleEnd(v: Vec2) {
    // // const m = this.conputerMatrix(v, this.flag);
    // const m = new DOMMatrix();
    // this.transferEnd(v, m, this.flag);
    switch (this.flag) {
      case "translate":
        {
          const { x, y } = UtilTools.unZoomPosition(
            this.board.zoom,
            this.startPosition
          );
          const { x: nX, y: nY } = UtilTools.unZoomPosition(this.board.zoom, v);
          const matrix = UtilTools.translate({ x, y }, { x: nX, y: nY });
          this.transferEnd(v, matrix, this.flag);
        }
        break;
      case "rotate":
        {
          const { x, y } = UtilTools.unZoomPosition(this.board.zoom, v);
          const matrix = UtilTools.rotate(
            this.coveredRect.centerPoint,
            { x, y }, //v,
            // this.initDegree
            0
          );
          this.board.changeCursor("grab");
          this.transferEnd(v, matrix, this.flag);
        }
        break;
      case "nw-scale":
        {
          const matrix = UtilTools.scale(
            v,
            this.startPosition,
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transferEnd(v, matrix, this.flag);
        }
        break;
      case "ne-scale":
        {
          const matrix = UtilTools.scale(
            { x: this.startPosition.x, y: v.y },
            { x: v.x, y: this.startPosition.y },
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transferEnd(v, matrix, this.flag);
        }
        break;
      case "sw-scale":
        {
          const matrix = UtilTools.scale(
            { x: v.x, y: this.startPosition.y },
            { x: this.startPosition.x, y: v.y },
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transferEnd(v, matrix, this.flag);
        }
        break;
      case "se-scale":
        {
          const matrix = UtilTools.scale(
            this.startPosition,
            v,
            this.coveredRect.getReferPointOpposite(this.flag)
          );
          this.transferEnd(v, matrix, this.flag);
        }
        break;
    }
    this.flag = null;
  }

  // TODO update nw-scale, ne-scale, sw-scale, se-scale with zoom
  override transfer(
    v: Vec2,
    matrix: DOMMatrix,
    type: ShapeActionType | null
  ): void {
    if (this.flag !== null) {
      this.board.clearCanvas("event");
      this.actionBar.closeBar();
      this.shapes.forEach((bs) => {
        bs.transfer(v, matrix, type);
      });
      super.transfer(v, matrix, type);
      this.assignScale();
      this.assignRotate();
    }
  }

  override transferEnd(
    v: Vec2,
    m: DOMMatrix,
    type: ShapeActionType | null
  ): void {
    if (type !== null) {
      this.shapes.forEach((bs) => {
        bs.transfer(v, m, type);
      });
      super.transferEnd(v, m, type);
      this.assignScale();
      this.assignRotate();
    }

    this.actionBar.openBar(this.coveredRectWithmatrix);
  }

  override updata(t: number): void {
    super.updata(t);
    if (this.showCtrlPoint) {
      this.scalePath.forEach((p) => {
        this.board.renderPathToEvent(p, defauletScalePoint);
      });
      this.board.renderPathToEvent(this.rotatePath, defauletRotatePoint);
    }
  }

  private assignScale() {
    this.coveredRectWithmatrix.fourCorner.forEach((point, i) => {
      const { x, y } = point;
      const p = new Path2D();
      p.arc(x, y, 8, 0, 2 * Math.PI);
      this.scalePath[i] = p;
    });
  }
  private assignRotate() {
    const { x, y } = this.coveredRectWithmatrix.rotatePoint;
    const p = new Path2D();
    p.arc(x, y, 8, 0, 2 * Math.PI);
    this.rotatePath = p;
  }

  private clearAllPath() {
    const once = new Path2D();
    this.path = once;
    this.rotatePath = once;
    this.scalePath = [once, once, once, once];
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

  openBar(mrv: Rect) {
    if (!this.openFlag) {
      this.openFlag = true;
      const {
        leftTop: { x: x1, y: y1 },
      } = mrv.rectPoint;

      this.block.style.top = `${y1 / this.board.devicePixelRatio - interval}px`;
      this.block.style.left = `${
        (x1 - padding - defaultSolidboxStyle.lineWidth) /
        this.board.devicePixelRatio
      }px`;
      this.rootBlock?.append(this.block);
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
