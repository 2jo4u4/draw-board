import * as pdfjsLib from "pdfjs-dist";
import { BaseShape } from "./";
import { Board, defaultImageShapeStyle, Rect, UtilTools } from "..";

type URLString = string;

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

export class PDFShape extends BaseShape {
  fileReader: FileReader;
  pdftask: pdfjsLib.PDFDocumentLoadingTask | null = null;
  private isLoad = false;
  private __currentPage = 1;
  get currentPage(): number {
    return this.__currentPage;
  }

  constructor(id: string, board: Board, source: string, m?: DOMMatrix) {
    const rect = new Rect();
    super(
      id,
      board,
      UtilTools.minRectToPath(rect),
      { lineColor: "#000", lineWidth: 1 },
      rect,
      m
    );

    this.fileReader = new FileReader();

    pdfjsLib.getDocument(source);
  }

  initialFileReader() {
    this.fileReader.onload = (event) => {
      if (event.target === null) {
        throw new Error("not found target");
      }
      const typedArray = event.target.result;
      if (typeof typedArray === "string") {
        this.pdftask = pdfjsLib.getDocument(typedArray);
        this.isLoad = true;
      }
    };
  }

  prevPage() {
    const page = this.currentPage - 1;
    if (page !== 0) {
      this.renderPdf(page);
    }
  }
  nextPage() {
    const page = this.currentPage + 1;
    this.renderPdf(page);
  }

  renderPdf(page = this.__currentPage) {
    if (this.isLoad) {
      const [width, height] = this.board.size;
      const ctx = this.board.ctxStatic;
      this.pdftask?.promise.then(
        (pdf) => {
          pdf
            .getPage(page)
            .then((page) => {
              const scale = 1;
              const viewport = page.getViewport({ scale: scale });
              const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
              };
              const renderTask = page.render(renderContext);
              renderTask.promise.then(() => {
                console.log("Page rendered");
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
  }
}
