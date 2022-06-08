import * as math from "mathjs";
import { BaseShape } from ".";

const dashedLine = [10, 10];
export const padding = 8; // px
// 畫筆預設樣式
export const defaultStyle: Styles = {
  lineColor: "#000",
  lineWidth: 4,
  fillColor: undefined,
  lineDash: [],
};

export const defaultImageShapeStyle: Styles = {
  lineColor: "#000000",
  lineWidth: 4,
  fillColor: "#00000030",
  lineDash: [],
};

export const defaultDeleteStyle: Styles = {
  lineColor: "red",
  lineWidth: 4,
  fillColor: undefined,
  lineDash: [],
};

// 選擇固定框預設樣式
export const defaultSolidboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000080",
  lineDash: dashedLine,
  fillColor: undefined,
};

// 選擇伸縮框預設樣式
export const defaultFlexboxStyle: Styles = {
  lineWidth: 2,
  lineColor: "#00000050",
  lineDash: dashedLine,
};

export const defaultTransform: Transform = {
  a: 1.0,
  b: 0.0,
  c: 0.0,
  d: 1.0,
  e: 0.0,
  f: 0.0,
};

/** 計算函式 / 工具函式 */
export class UtilTools {
  static getCnavasElement(c?: string | HTMLElement): HTMLCanvasElement {
    if (c instanceof HTMLCanvasElement) {
      return c;
    } else if (typeof c === "string") {
      const el = document.getElementById(c);
      if (el && el instanceof HTMLCanvasElement) {
        return el;
      }
    }
    return document.createElement("canvas");
  }
  static checkCanvasContext(c: HTMLCanvasElement) {
    const ctx = c.getContext("2d");
    if (ctx) {
      return ctx;
    } else {
      throw new Error("無法獲取 getContext");
    }
  }

  /** 揉合兩點座標成最小矩形 */
  static generateMinRect(v1: Vec2, v2: Vec2): Rect {
    const { x: x1, y: y1 } = v1;
    const { x: x2, y: y2 } = v2;

    return new Rect({
      leftTop: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
      rightBottom: { x: Math.max(x1, x2), y: Math.max(y1, y2) },
    });
  }

  /** 是否為 Vec2 */
  static isVec2(v: unknown): v is Vec2 {
    return (
      Object.prototype.hasOwnProperty.call(v, "x") &&
      Object.prototype.hasOwnProperty.call(v, "y")
    );
  }

  static cos(theta: number) {
    return math.cos(theta);
  }
  static sin(theta: number) {
    return math.sin(theta);
  }
  static atan2(y: number, x: number) {
    return math.atan2(y, x);
  }
  static matrixMultiply(a: math.Matrix, b: math.Matrix) {
    return math.multiply(a, b);
  }

  static transformToMatrix(transform: Transform) {
    const { a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = transform;
    return math.matrix([
      [a, c, e],
      [b, d, f],
      [0, 0, 1],
    ]);
  }

  static getTransformFromMatrix(matrix: math.Matrix) {
    return {
      a: matrix.subset(math.index(0, 0)),
      b: matrix.subset(math.index(1, 0)),
      c: matrix.subset(math.index(0, 1)),
      d: matrix.subset(math.index(1, 1)),
      e: matrix.subset(math.index(0, 2)),
      f: matrix.subset(math.index(1, 2)),
    };
  }

  static nextTransform(
    prevTransform: Transform,
    { dx = 0, dy = 0, rScale = 1, dTheta = 0, cx = 0, cy = 0 }
  ) {
    const transformMatrix = this.transformToMatrix(prevTransform);
    const translateToOriginMatrix = this.transformToMatrix({
      e: dx - cx,
      f: dy - cy,
    });
    const scaleMatrix = this.transformToMatrix({ a: rScale, d: rScale });
    const rotationMatrix = this.transformToMatrix({
      a: this.cos(dTheta),
      b: this.sin(dTheta),
      c: -this.sin(dTheta),
      d: this.cos(dTheta),
    });
    const translateBackMatrix = this.transformToMatrix({
      e: cx,
      f: cy,
    });
    const applyTranslateToOrigin = this.matrixMultiply(
      translateToOriginMatrix,
      transformMatrix
    );
    const applyScale = this.matrixMultiply(scaleMatrix, applyTranslateToOrigin);
    const applyRotation = this.matrixMultiply(rotationMatrix, applyScale);
    const result = this.matrixMultiply(translateBackMatrix, applyRotation);
    return this.getTransformFromMatrix(result);
  }

  /** 是否為 MinRectVec */
  static isMinRectVec(v: unknown): v is MinRectVec {
    return (
      Object.prototype.hasOwnProperty.call(v, "leftTop") &&
      Object.prototype.hasOwnProperty.call(v, "rightBottom")
    );
  }

  /**
   * 計算新座標是否影響最小矩形
   * @param vec 座標
   * @param minRectVec 矩形座標
   * @returns 新矩形座標
   */
  static newMinRect(vec: Vec2, minRectVec: MinRectVec): MinRectVec {
    const cp = UtilTools.deepClone(minRectVec);
    const { leftTop, rightBottom } = minRectVec;
    const { x, y } = vec;
    if (x < leftTop.x && x < rightBottom.x) {
      cp.leftTop.x = x;
    } else if (x > leftTop.x && x > rightBottom.x) {
      cp.rightBottom.x = x;
    }
    if (y < leftTop.y && y < rightBottom.y) {
      cp.leftTop.y = y;
    } else if (y > leftTop.y && y > rightBottom.y) {
      cp.rightBottom.y = y;
    }
    return cp;
  }

  /**
   * 計算最小矩形 且 可包含所有傳入之矩形
   * @param arge 各個矩形
   * @returns 可包含所有矩形之最小矩形
   */
  static mergeMinRect(...arge: MinRectVec[]): Rect {
    const rect: MinRectVec = {
      leftTop: { x: Infinity, y: Infinity },
      rightBottom: { x: 0, y: 0 },
    };

    arge.forEach((item) => {
      const {
        leftTop: { x: sx, y: sy },
        rightBottom: { x: ex, y: ey },
      } = item;

      const {
        leftTop: { x: nsx, y: nsy },
        rightBottom: { x: nex, y: ney },
      } = rect;

      rect.leftTop.x = Math.min(sx, nsx);
      rect.leftTop.y = Math.min(sy, nsy);
      rect.rightBottom.x = Math.max(ex, nex);
      rect.rightBottom.y = Math.max(ey, ney);
    });

    return new Rect(rect);
  }

  /** 深拷貝 */
  static deepClone<T extends Object>(o: T): T {
    const newObject = Object.assign({}, o);
    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        const element = o[key];
        if (typeof element === "object") {
          newObject[key] = UtilTools.deepClone(element);
        }
      }
    }
    return newObject;
  }

  /** 事件分辨 */
  static isMouseEvent(event: TouchEvent | MouseEvent): event is MouseEvent {
    return event instanceof MouseEvent;
  }

  /**
   * 隨機命名
   * @param s 已存在的ID陣列（可不傳遞 不保證ID是否唯一）
   * @returns
   */
  static RandomID(s?: string[]): string {
    const id = Math.random().toString(36).slice(2, 12);
    if (s && s.find((item) => item === id)) {
      return UtilTools.RandomID(s);
    } else {
      return id;
    }
  }

  /** 樣式注入 */
  static injectStyle(ctx: CanvasRenderingContext2D, s: Styles) {
    const { lineColor, lineWidth, lineDash, fillColor } = s;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(lineDash || []);
    ctx.fillStyle = fillColor || "";
  }

  /**
   * 利用最小矩形產生路徑
   *
   * @deprecated parameter(padding) will delete
   */
  static minRectToPath(mrv: Rect | MinRectVec, padding = 0): Path2D {
    const scaleX = 1.2,
      scaleY = 1.2,
      path = new Path2D(),
      m = new DOMMatrix();
    if (mrv instanceof Rect) {
      const { nw, ne, sw, se } = mrv;
      path.moveTo(nw.x, nw.y);
      path.lineTo(ne.x, ne.y);
      path.lineTo(se.x, se.y);
      path.lineTo(sw.x, sw.y);
      path.lineTo(nw.x, nw.y);
      m.scale(scaleX, scaleY, 1, mrv.centerPoint.x, mrv.centerPoint.y);
    } else {
      const {
        leftTop: { x: x1, y: y1 },
        rightBottom: { x: x2, y: y2 },
      } = mrv;
      path.rect(x1, y1, x2 - x1, y2 - y1);
      m.scale(scaleX, scaleY, 1, x1 + (x2 - x1), y1 + (y2 - y1));
    }
    const mp = new Path2D();
    mp.addPath(path, m);

    return mp;
  }

  static isBaseShape(bs: unknown): bs is BaseShape {
    return bs instanceof BaseShape;
  }

  /** 取得中心點 */
  static getMinRectCenter(mrv: MinRectVec): Vec2 {
    const {
      leftTop: { x: x1, y: y1 },
      rightBottom: { x: x2, y: y2 },
    } = mrv;

    return { x: x1 + (x2 - x1) / 2, y: y1 + (y2 - y1) / 2 };
  }

  /** 取得偏移量(dx,dy) */
  static getOffset(prev: Vec2, next: Vec2): [number, number] {
    return [next.x - prev.x, next.y - prev.y];
  }

  /** 移動 */
  static translate(prev: Vec2, next: Vec2): DOMMatrix {
    const [dx, dy] = UtilTools.getOffset(prev, next);
    return new DOMMatrix().translate(dx, dy);
  }
  /** 旋轉 */
  static rotate(center: Vec2, next: Vec2, initDegree?: number): DOMMatrix {
    return new DOMMatrix()
      .translate(center.x, center.y)
      .rotate(UtilTools.getDegree(UtilTools.getAngle(center, next), initDegree))
      .translate(-center.x, -center.y);
  }
  /** 縮放 */
  static scale(prev: Vec2, next: Vec2, c?: Rect | Vec2): DOMMatrix {
    let center: Vec2 | undefined = undefined;
    const scaleX = next.x / prev.x,
      scaleY = next.y / prev.y;
    if (c) {
      if (c instanceof Rect) {
        center = c.centerPoint;
      } else {
        center = c;
      }
    }
    return center
      ? new DOMMatrix().scale(scaleX, scaleY, 1, center.x, center.y)
      : new DOMMatrix().scale(scaleX, scaleY);
  }

  /** 取得兩點間之弧度 */
  static getAngle(prev: Vec2, next: Vec2): number {
    const { x: x1, y: y1 } = prev,
      { x: x2, y: y2 } = next;
    return Math.atan2(y1 - y2, x1 - x2);
  }

  static getDegree(angle: number, initDegree = 0): number {
    return ((angle * 180) / Math.PI - initDegree) % 360;
  }
}

export class Rect {
  nw: DOMPoint;
  ne: DOMPoint;
  sw: DOMPoint;
  se: DOMPoint;

  rotatePoint: DOMPoint;
  constructor(
    nw?: Vec2 | MinRectVec | DOMPoint,
    ne?: Vec2 | DOMPoint,
    sw?: Vec2 | DOMPoint,
    se?: Vec2 | DOMPoint
  ) {
    if (nw) {
      if (UtilTools.isMinRectVec(nw)) {
        this.nw = new DOMPoint(nw.leftTop.x, nw.leftTop.y);
        this.ne = new DOMPoint(nw.rightBottom.x, nw.leftTop.y);
        this.sw = new DOMPoint(nw.leftTop.x, nw.rightBottom.y);
        this.se = new DOMPoint(nw.rightBottom.x, nw.rightBottom.y);
      } else {
        this.nw = new DOMPoint(nw.x, nw.y);
        this.ne = ne ? new DOMPoint(ne.x, ne.y) : new DOMPoint(nw.x, nw.y);
        this.sw = sw ? new DOMPoint(sw.x, sw.y) : new DOMPoint(nw.x, nw.y);
        this.se = se ? new DOMPoint(se.x, se.y) : new DOMPoint(nw.x, nw.y);
      }
    } else {
      this.nw = new DOMPoint();
      this.ne = new DOMPoint();
      this.sw = new DOMPoint();
      this.se = new DOMPoint();
    }

    this.rotatePoint = new DOMPoint(this.sw.x - padding, this.sw.y + padding);
  }

  get centerPoint(): Vec2 {
    return {
      x: (this.nw.x + this.se.x) / 2,
      y: (this.nw.y + this.se.y) / 2,
    };
  }

  get rectPoint(): MinRectVec {
    const x = [this.nw.x, this.sw.x, this.ne.x, this.se.x],
      y = [this.nw.y, this.sw.y, this.ne.y, this.se.y];

    return {
      leftTop: { x: Math.min(...x), y: Math.min(...y) },
      rightBottom: { x: Math.max(...x), y: Math.max(...y) },
    };
  }

  get nwPoint(): Vec2 {
    return this.nw;
  }

  get nePoint(): Vec2 {
    return this.ne;
  }

  get swPoint(): Vec2 {
    return this.sw;
  }

  get sePoint(): Vec2 {
    return this.se;
  }

  get fourCorner(): [DOMPoint, DOMPoint, DOMPoint, DOMPoint] {
    return [this.nw, this.ne, this.sw, this.se];
  }

  clone(): Rect {
    return new Rect(this.nw, this.ne, this.sw, this.se);
  }

  translateSelf(matrix: DOMMatrix): Rect {
    this.nw = this.nw.matrixTransform(matrix);
    this.ne = this.ne.matrixTransform(matrix);
    this.sw = this.sw.matrixTransform(matrix);
    this.se = this.se.matrixTransform(matrix);
    this.rotatePoint = this.rotatePoint.matrixTransform(matrix);
    return this;
  }
  scaleSelf(matrix: DOMMatrix): Rect {
    this.nw = this.nw.matrixTransform(matrix);
    this.ne = this.ne.matrixTransform(matrix);
    this.sw = this.sw.matrixTransform(matrix);
    this.se = this.se.matrixTransform(matrix);
    this.rotatePoint = this.rotatePoint.matrixTransform(matrix);
    return this;
  }
  rotateSelf(matrix: DOMMatrix): Rect {
    this.nw = this.nw.matrixTransform(matrix);
    this.ne = this.ne.matrixTransform(matrix);
    this.sw = this.sw.matrixTransform(matrix);
    this.se = this.se.matrixTransform(matrix);
    this.rotatePoint = this.rotatePoint.matrixTransform(matrix);
    return this;
  }

  getReferPointOpposite(type: ShapeActionType): Vec2 {
    switch (type) {
      case "nw-scale":
        return this.sePoint;
      case "ne-scale":
        return this.swPoint;
      case "sw-scale":
        return this.nePoint;
      case "se-scale":
        return this.nwPoint;
      case "rotate":
      case "translate":
      default:
        return this.centerPoint;
    }
  }

  getReferPointSameSide(type: ShapeActionType): Vec2 {
    switch (type) {
      case "nw-scale":
        return this.nwPoint;
      case "ne-scale":
        return this.nePoint;
      case "sw-scale":
        return this.swPoint;
      case "se-scale":
        return this.sePoint;
      case "rotate":
      case "translate":
      default:
        return this.centerPoint;
    }
  }
}
