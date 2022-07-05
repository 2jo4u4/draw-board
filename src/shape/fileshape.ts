import * as pdfjsLib from "pdfjs-dist";
import { BaseShape } from ".";
import { defaultFileShapeStyle, Rect, UtilTools } from "..";
import type { Board, Vec2, MinRectVec } from "..";

type URLString = string;
interface FileConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  transform: DOMMatrix;
}

const defStartPosition: Vec2 = { x: 50, y: 50 };
const defaultWidth = 100;
const beforeLoad: MinRectVec = {
  leftTop: defStartPosition,
  rightBottom: {
    x: defStartPosition.x + defaultWidth,
    y: defStartPosition.y + defaultWidth,
  },
};

export abstract class FileShape {
  abstract htmlEl: CanvasImageSource;
}

export class ImageShape extends BaseShape implements FileShape {
  readonly $type;
  htmlEl: HTMLImageElement;
  isLoad = false;
  startPoint: Vec2;
  override get matrix() {
    return DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(
      this.stagingMatrix
    );
  }

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    config?: FileConfig
  ) {
    let rect!: Rect, matrix!: DOMMatrix, startPoint: Vec2;
    if (config) {
      startPoint = { x: config.x, y: config.y };
      rect = new Rect({
        leftTop: startPoint,
        rightBottom: {
          x: config.x + config.width,
          y: config.y + config.height,
        },
      });
      matrix = DOMMatrix.fromMatrix(config.transform);
    } else {
      startPoint = defStartPosition;
      rect = new Rect(beforeLoad);
      matrix = new DOMMatrix();
    }

    super(
      id,
      board,
      UtilTools.minRectToPath(rect),
      defaultFileShapeStyle,
      rect,
      matrix
    );
    this.$type = "image-shape";
    this.htmlEl = new Image();
    this.startPoint = startPoint;
    this.htmlEl.onload = (event) => {
      this.changeLoadStatue();
    };

    if (typeof source === "string") {
      this.htmlEl.src = source;
    } else {
      this.htmlEl.src = URL.createObjectURL(source);
    }
  }

  changeLoadStatue() {
    if (!this.isLoad) {
      this.isLoad = true;
      const { width, height } = this.htmlEl;
      this.path = new Path2D();
      this.path.rect(this.startPoint.x, this.startPoint.y, width, height);
      this.reInit(
        this.path,
        new Rect({
          leftTop: this.startPoint,
          rightBottom: {
            x: width + this.startPoint.x,
            y: height + this.startPoint.y,
          },
        })
      );
    }
  }
}

export class PDFShape extends BaseShape implements FileShape {
  readonly $type;
  fileReader: FileReader;
  pdftask: pdfjsLib.PDFDocumentLoadingTask | null = null;
  isLoad = false;
  startPoint: Vec2;
  private __currentPage = 1;
  get currentPage(): number {
    return this.__currentPage;
  }
  override get matrix() {
    return DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(
      this.stagingMatrix
    );
  }
  htmlEl: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    config?: FileConfig
  ) {
    let rect!: Rect, matrix!: DOMMatrix, startPoint: Vec2;
    if (config) {
      startPoint = { x: config.x, y: config.y };
      rect = new Rect({
        leftTop: startPoint,
        rightBottom: {
          x: config.x + config.width,
          y: config.y + config.height,
        },
      });
      matrix = DOMMatrix.fromMatrix(config.transform);
    } else {
      startPoint = defStartPosition;
      rect = new Rect(beforeLoad);
      matrix = new DOMMatrix();
    }

    super(
      id,
      board,
      UtilTools.minRectToPath(rect),
      defaultFileShapeStyle,
      rect,
      matrix
    );
    this.$type = "pfd-shape";
    this.fileReader = new FileReader();
    this.htmlEl = document.createElement("canvas");
    this.startPoint = startPoint;
    this.ctx = UtilTools.checkCanvasContext(this.htmlEl);
    if (typeof source === "string") {
      this.pdfReadUri(source);
    } else {
      this.pdfReadUri(URL.createObjectURL(source));
    }
  }

  prevPage() {
    const page = this.currentPage - 1;
    if (page !== 0) {
      this.settingCanvas(page);
    }
  }

  nextPage() {
    const page = this.currentPage + 1;
    this.settingCanvas(page);
  }

  initial(file: File | string) {
    if (typeof file === "string") {
      this.pdfReadUri(file);
    } else {
      if (file.type !== "application/pdf") {
        alert(`${file.name}, is not a pdf file.`);
      } else {
        this.initialFileReader();
        this.fileReader.readAsDataURL(file);
      }
    }
  }

  override transfer(v: Vec2, m: DOMMatrix, type: ShapeActionType | null): void {
    super.transfer(v, m, type);
  }

  override transferEnd(
    v: Vec2,
    m: DOMMatrix,
    type: ShapeActionType | null
  ): void {
    super.transferEnd(v, m, type);
  }

  private initialFileReader() {
    this.fileReader.onload = (event) => {
      if (event.target === null) {
        throw new Error("not found target");
      }
      const typedArray = event.target.result;
      if (typeof typedArray === "string") {
        this.pdfReadUri(typedArray);
      }
    };
  }

  private pdfReadUri(uri: string) {
    this.pdftask = pdfjsLib.getDocument(uri);
    this.settingCanvas();
  }

  private settingCanvas(page = this.__currentPage) {
    this.pdftask?.promise.then(
      (pdf) => {
        pdf
          .getPage(page)
          .then((page) => {
            const canvasContext = this.ctx,
              viewport = page.getViewport({ scale: 1 }),
              context = { canvasContext, viewport };
            this.setCanvasStyle(viewport.width, viewport.height);
            const newRect = new Rect({
              leftTop: this.startPoint,
              rightBottom: {
                x: this.startPoint.x + viewport.width,
                y: this.startPoint.y + viewport.height,
              },
            });
            this.reInit(UtilTools.minRectToPath(newRect), newRect);

            page.render(context).promise.then(() => {
              this.isLoad = true;
            });
          })
          .catch((e) => {
            console.error(e);
          });
      },
      (reason) => {
        console.error(reason);
      }
    );
  }

  private setCanvasStyle(width: number, height: number) {
    this.htmlEl.setAttribute(
      "width",
      `${width * this.board.devicePixelRatio}px`
    );
    this.htmlEl.setAttribute(
      "height",
      `${height * this.board.devicePixelRatio}px`
    );
    this.htmlEl.style.width = `${width}px`;
    this.htmlEl.style.height = `${height}px`;
  }
}
