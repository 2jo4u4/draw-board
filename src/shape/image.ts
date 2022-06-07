import { BaseShape } from "./";
import { Board, defaultImageShapeStyle, Rect } from "..";

type URLString = string;

export class ImageShape extends BaseShape {
  readonly $type;
  image: HTMLImageElement;

  constructor(id: string, board: Board, source: URLString | Blob) {
    super(id, board, new Path2D(), defaultImageShapeStyle, new Rect());
    this.path.rect(50, 50, 100, 100);

    this.$type = "image-shape";
    this.image = new Image();
    this.image.onload = (event) => {
      // this.board.addShape()
    };
    this.image.src =
      typeof source === "string" ? source : URL.createObjectURL(source);
  }
}
