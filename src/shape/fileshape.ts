import * as pdfjsLib from "pdfjs-dist";
import { BaseShape } from ".";
import { defaultFileShapeStyle, Rect, UtilTools } from "..";
import type { Board, Vec2, MinRectVec } from "..";

type URLString = string;
interface FileConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  transform?: DOMMatrix;
  fileName?: string;
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

/**
 * @deprecated
 */
export abstract class FileShape {
  abstract htmlEl: CanvasImageSource;
}

export class ImageShape extends BaseShape {
  readonly $type;
  htmlEl: HTMLImageElement;
  isLoad = false;
  startPoint: Vec2;
  filename: string;
  override get matrix() {
    return DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(
      this.stagingMatrix
    );
  }
  override set matrix(m: DOMMatrix) {
    this.__matrix = m;
  }

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    config?: FileConfig
  ) {
    let rect!: Rect,
      matrix!: DOMMatrix,
      startPoint: Vec2,
      _fileName = "unknown";
    if (config) {
      const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        transform,
        fileName,
      } = config;
      startPoint = { x: x, y: y };
      rect = new Rect({
        leftTop: startPoint,
        rightBottom: {
          x: x + width,
          y: y + height,
        },
      });
      matrix = DOMMatrix.fromMatrix(transform);
      _fileName = fileName || _fileName;
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
    this.filename = _fileName;
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

  override updata(t: number): void {
    if (!this.isDelete) {
      if (this.isLoad) {
        const ctx = this.isSelect ? this.board.ctx : this.board.ctxStatic;
        const { x, y } = this.coveredRect.nw;
        const [width, height] = this.coveredRect.size;
        ctx.setTransform(
          DOMMatrix.fromMatrix(this.finallyMatrix).preMultiplySelf(
            this.board.refZoomMatrix
          )
        );
        ctx.drawImage(this.htmlEl, x, y, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        super.updata(t);
      }
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

export class PDFShape extends BaseShape {
  readonly $type;
  fileReader: FileReader;
  pdftask: pdfjsLib.PDFDocumentLoadingTask | null = null;
  isLoad = false;
  startPoint: Vec2;
  filename: string;
  private __currentPage = 1;
  get currentPage(): number {
    return this.__currentPage;
  }
  override get matrix() {
    return DOMMatrix.fromMatrix(this.__matrix).preMultiplySelf(
      this.stagingMatrix
    );
  }
  override set matrix(m: DOMMatrix) {
    this.__matrix = m;
  }

  override get isSelect() {
    return super.isSelect;
  }
  override set isSelect(b: boolean) {
    super.isSelect = b;
    if (super.isSelect) {
      this.selfControlBarOpen();
    } else {
      this.selfControlBarClose();
    }
  }

  htmlEl: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bar: PDFControlBar;
  private __totalpage: number = 0;
  get totalpage() {
    return this.__totalpage;
  }

  constructor(
    id: string,
    board: Board,
    source: URLString | Blob,
    config?: FileConfig
  ) {
    let rect!: Rect,
      matrix!: DOMMatrix,
      startPoint: Vec2,
      _fileName = "unknown";
    if (config) {
      const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        transform,
        fileName,
      } = config;
      startPoint = { x: x, y: y };
      rect = new Rect({
        leftTop: startPoint,
        rightBottom: {
          x: x + width,
          y: y + height,
        },
      });
      matrix = DOMMatrix.fromMatrix(transform);
      _fileName = fileName || _fileName;
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
    this.$type = "pdf-shape";
    this.filename = _fileName;
    this.fileReader = new FileReader();
    this.htmlEl = document.createElement("canvas");
    this.startPoint = startPoint;
    this.ctx = UtilTools.checkCanvasContext(this.htmlEl);
    if (typeof source === "string") {
      this.pdfReadUri(source);
    } else {
      this.pdfReadUri(URL.createObjectURL(source));
    }
    this.bar = new PDFControlBar(this);
  }

  prevPage() {
    const page = this.currentPage - 1;
    if (page !== 0) {
      this.settingCanvas(page);
    }
  }

  nextPage() {
    const page = this.currentPage + 1;
    if (this.totalpage >= page) {
      this.settingCanvas(page);
    }
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

  override transferStart(v: Vec2, m: DOMMatrix, type: ShapeActionType | null) {
    super.transferStart(v, m, type);
    this.bar.close();
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
    this.bar.open();
  }

  override updata(t: number): void {
    if (!this.isDelete) {
      if (this.isLoad) {
        const ctx = this.isSelect ? this.board.ctx : this.board.ctxStatic;
        const { x, y } = this.coveredRect.nw;
        const [width, height] = this.coveredRect.size;
        ctx.setTransform(
          DOMMatrix.fromMatrix(this.finallyMatrix).preMultiplySelf(
            this.board.refZoomMatrix
          )
        );
        ctx.drawImage(this.htmlEl, x, y, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        super.updata(t);
      }
    }
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
    if (this.pdftask) {
      this.pdftask.promise.then((pdf) => {
        this.__totalpage = pdf.numPages;
      });
    }
    this.settingCanvas();
  }

  private settingCanvas(pageNumber = this.__currentPage) {
    this.pdftask?.promise.then(
      (pdf) => {
        pdf
          .getPage(pageNumber)
          .then((page) => {
            const canvasContext = this.ctx,
              viewport = page.getViewport({ scale: 1.2 }),
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
              this.__currentPage = pageNumber;
              this.bar.pageInfoSetting();
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

  private selfControlBarOpen() {
    this.bar.open();
  }
  private selfControlBarClose() {
    this.bar.close();
  }
}

class PDFControlBar {
  pdfshape: PDFShape;
  headEl: HTMLDivElement;
  footerEl: HTMLDivElement;
  rootEl: HTMLDivElement;
  isOpen: boolean;
  pageInfo: HTMLSpanElement;

  get worldPoint() {
    return this.pdfshape.coveredRectWithmatrix.transferSelf(
      this.pdfshape.zoomMatrix
    );
  }

  constructor(pdfshape: PDFShape) {
    this.isOpen = false;
    this.pdfshape = pdfshape;
    this.rootEl = pdfshape.board.rootBlock;
    this.headEl = document.createElement("div");
    this.footerEl = document.createElement("div");
    this.pageInfo = document.createElement("span");
    this.settingDivCommonStyle(this.headEl, "head");
    this.settingDivCommonStyle(this.footerEl, "footer");
    this.settingHeadDiv();
    this.settingFooterDiv();
  }

  pageInfoSetting() {
    this.pageInfo.innerText = `${this.pdfshape.currentPage} / ${this.pdfshape.totalpage}`;
  }

  open() {
    if (!this.isOpen) {
      const { x, y } = this.worldPoint.nw;
      const { x: x1 } = this.worldPoint.ne;
      const { y: y1 } = this.worldPoint.sw;

      const width = x1 - x;
      this.headEl.style.top = `${y - 20}px`;
      this.headEl.style.left = `${x}px`;
      this.headEl.style.width = `${width}px`;
      this.footerEl.style.top = `${y1 - 12}px`;
      this.footerEl.style.left = `${x}px`;
      this.footerEl.style.width = `${width}px`;
      this.rootEl.append(this.headEl, this.footerEl);

      this.pageInfoSetting();
      this.isOpen = true;
    }
  }
  close() {
    if (this.isOpen) {
      this.headEl.remove();
      this.footerEl.remove();
      this.isOpen = false;
    }
  }

  private settingDivCommonStyle(el: HTMLDivElement, type: "head" | "footer") {
    el.style.position = "absolute";
    el.style.height = "32px";
    el.style.backgroundColor = "#eaf0f7";

    el.style.border = "1px solid rgb(204, 204, 204)";
    if (type === "footer") {
      el.style.borderRadius = "0px 0px 16px 16px";
      el.style.display = "flex";
      el.style.justifyContent = "center";
      el.style.alignItems = "center";
    } else {
      el.style.borderRadius = "16px 16px 0px 0px";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.justifyContent = "center";
    }
  }

  private settingHeadDiv() {
    const p = document.createElement("p");
    p.style.margin = "0px";
    p.style.padding = "0px";
    p.style.textAlign = "center";
    p.innerText = `${this.pdfshape.filename}.pdf`;
    this.headEl.append(p);
  }

  private settingFooterDiv() {
    const prevBtn = document.createElement("span");
    prevBtn.innerText = "<";
    prevBtn.style.margin = "0px 8px 0px 0px";
    prevBtn.style.cursor = "pointer";
    prevBtn.onclick = () => this.pdfshape.prevPage();

    const nextBtn = document.createElement("span");
    nextBtn.innerText = ">";
    nextBtn.style.margin = "0px 0px 0px 8px";
    nextBtn.style.cursor = "pointer";
    nextBtn.onclick = () => this.pdfshape.nextPage();

    this.footerEl.append(prevBtn, this.pageInfo, nextBtn);
  }
}
