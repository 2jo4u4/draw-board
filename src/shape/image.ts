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
  regMatrix: DOMMatrix;

  override get path(): Path2D {
    if (this.isLoad) {
      if (this.isSelect) {
      } else {
      }
    }
    return this.__path;
  }

  override set path(p: Path2D) {
    this.__path = p;
  }

  constructor(id: string, board: Board, source: URLString | Blob) {
    const p = UtilTools.minRectToPath(beforeLoad);
    super(id, board, p, defaultImageShapeStyle, new Rect(beforeLoad));
    this.$type = "image-shape";
    this.image = new Image();
    this.board.addShapeByBs(this);
    this.image.onload = (event) => {
      this.changeLoadStatue();
    };
    this.image.src =
      typeof source === "string" ? source : URL.createObjectURL(source);

    this.matrix = new DOMMatrix();
    this.regMatrix = new DOMMatrix();
  }

  override transferStart(
    v: Vec2,
    matrix: DOMMatrix,
    type: ShapeActionType | null
  ): void {
    this.regPath = new Path2D(this.path);
    this.regCoveredRect = this.coveredRect.clone();
    this.regStartPosition = new DOMPoint(v.x, v.y);
    this.regMatrix = cloneMatrix(this.matrix);
  }

  // override transfer(v: Vec2, matrix: DOMMatrix, type: ShapeActionType): void {
  //   this.path = new Path2D();
  //   this.path.addPath(this.regPath, matrix);
  //   this.coveredRect = this.regCoveredRect.transfer(matrix);
  //   this.matrix = matrix;
  //   this.board.rerenderToEvent({ bs: this });
  // }

  // override transferEnd(
  //   v: Vec2,
  //   matrix: DOMMatrix,
  //   type: ShapeActionType
  // ): void {
  //   this.path = new Path2D();
  //   this.path.addPath(this.regPath, matrix);
  //   this.matrix = this.regMatrix.multiply(matrix);
  //   this.board.rerenderToEvent({ bs: this });
  //   this.updataBindingBox(matrix);
  //   this.logAction(type, matrix.inverse());
  // }

  changeLoadStatue() {
    if (!this.isLoad) {
      this.isLoad = true;
      const { width, height } = this.image;
      this.path = new Path2D();
      this.path.rect(startPosition.x, startPosition.y, width, height);
      this.reInit(this.path, {
        leftTop: startPosition,
        rightBottom: {
          x: width + startPosition.x,
          y: height + startPosition.y,
        },
      });
      this.board.rerenderToPaint({ needClear: true, bs: this });
    }
  }
}

function cloneMatrix(matrix: DOMMatrix) {
  return new DOMMatrix([
    matrix.a,
    matrix.b,
    matrix.c,
    matrix.d,
    matrix.e,
    matrix.f,
  ]);
}
