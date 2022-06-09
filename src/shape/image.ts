import { BaseShape } from "./";
import { Board, defaultImageShapeStyle, Rect, UtilTools } from "..";

type URLString = string;

const startPosition: Vec2 = {
  x: 50,
  y: 50,
};
const defaultWidth = 100;
const beforeLoad: MinRectVec = {
  leftTop: startPosition,
  rightBottom: {
    x: startPosition.x + defaultWidth,
    y: startPosition.y + defaultWidth,
  },
};
export class ImageShape extends BaseShape {
  readonly $type;
  image: HTMLImageElement;
  isLoad = false;
  regPath!: Path2D;
  regCoveredRect!: Rect;
  regStartPosition!: DOMPoint;

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    matrix?: DOMMatrix
  ) {
    const p = UtilTools.minRectToPath(beforeLoad);
    super(id, board, p, defaultImageShapeStyle, new Rect(beforeLoad), matrix);
    this.$type = "image-shape";
    this.image = new Image();
    this.board.addShapeByBs(this);
    this.image.onload = (event) => {
      setTimeout(() => {
        this.changeLoadStatue();
      }, 3000);
    };
    this.image.src =
      typeof source === "string" ? source : URL.createObjectURL(source);
  }

  changeLoadStatue() {
    if (!this.isLoad) {
      this.isLoad = true;
      const { width, height } = this.image;
      this.path = new Path2D();
      this.path.rect(startPosition.x, startPosition.y, width, height);
      this.reInit(
        this.path,
        new Rect({
          leftTop: startPosition,
          rightBottom: {
            x: width + startPosition.x,
            y: height + startPosition.y,
          },
        })
      );
    }
  }
}
