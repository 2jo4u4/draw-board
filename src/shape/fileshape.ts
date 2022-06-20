import * as pdfjsLib from "pdfjs-dist";
import { BaseShape } from ".";
import { Board, defaultImageShapeStyle, Rect, UtilTools } from "..";

type URLString = string;
interface FileConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  transform: DOMMatrix;
}

const startPosition: Vec2 = { x: 50, y: 50 };
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
  htmlEl: HTMLImageElement;
  isLoad = false;

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    config?: FileConfig
  ) {
    let rect!: Rect, matrix!: DOMMatrix;
    if (config) {
      rect = new Rect({
        leftTop: { x: config.x, y: config.y },
        rightBottom: {
          x: config.x + config.width,
          y: config.y + config.height,
        },
      });
      matrix = DOMMatrix.fromMatrix(config.transform);
    } else {
      rect = new Rect(beforeLoad);
      matrix = new DOMMatrix();
    }
    super(
      id,
      board,
      UtilTools.minRectToPath(rect),
      defaultImageShapeStyle,
      rect,
      matrix
    );
    this.$type = "image-shape";
    this.htmlEl = new Image();
    this.board.addShapeByBs(this);
    this.htmlEl.onload = (event) => {
      this.changeLoadStatue();
    };

    if (typeof source === "string") {
      fetch(source)
        .then((res) => res.blob())
        .then((blob) => {
          this.htmlEl.src = URL.createObjectURL(blob);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      this.htmlEl.src = URL.createObjectURL(source);
    }
  }

  changeLoadStatue() {
    if (!this.isLoad) {
      this.isLoad = true;
      const { width, height } = this.htmlEl;
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

export class PDFShape extends BaseShape {
  fileReader: FileReader;
  pdftask: pdfjsLib.PDFDocumentLoadingTask | null = null;
  isLoad = false;
  private __currentPage = 1;
  get currentPage(): number {
    return this.__currentPage;
  }

  htmlEl: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    config?: FileConfig
  ) {
    let rect!: Rect, matrix!: DOMMatrix;
    if (config) {
      rect = new Rect({
        leftTop: { x: config.x, y: config.y },
        rightBottom: {
          x: config.x + config.width,
          y: config.y + config.height,
        },
      });
      matrix = DOMMatrix.fromMatrix(config.transform);
    } else {
      rect = new Rect(beforeLoad);
      matrix = new DOMMatrix();
    }
    super(
      id,
      board,
      UtilTools.minRectToPath(rect),
      { lineColor: "#000", lineWidth: 1 },
      rect,
      matrix
    );
    this.fileReader = new FileReader();
    this.htmlEl = document.createElement("canvas");
    this.ctx = UtilTools.checkCanvasContext(this.htmlEl);
    if (typeof source === "string") {
      fetch(source)
        .then((res) => res.blob())
        .then((blob) => {
          this.initial(URL.createObjectURL(blob));
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      this.initial(URL.createObjectURL(source));
    }
  }

  prevPage() {
    const page = this.currentPage - 1;
    if (page !== 0) {
      this.settingProxy(page);
    }
  }

  nextPage() {
    const page = this.currentPage + 1;
    this.settingProxy(page);
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
    this.settingProxy();
  }

  private settingProxy(page = this.__currentPage) {
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
              leftTop: { x: 0, y: 0 },
              rightBottom: { x: viewport.width, y: viewport.height },
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
