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
  static generateMinRect(v1: Vec2, v2: Vec2): MinRectVec {
    const { x: x1, y: y1 } = v1;
    const { x: x2, y: y2 } = v2;

    return {
      leftTop: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
      rightBottom: { x: Math.max(x1, x2), y: Math.max(y1, y2) },
    };
  }

  /** 是否為 Vec2 */
  static isVec2(v: Vec2 | MinRectVec): v is Vec2 {
    return (
      Object.prototype.hasOwnProperty.call(v, "x") &&
      Object.prototype.hasOwnProperty.call(v, "y")
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
  static mergeMinRect(...arge: MinRectVec[]): MinRectVec {
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

    return rect;
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

  /** 利用最小矩形產生路徑 */
  static minRectToPath(mrv: MinRectVec, padding = 0): Path2D {
    const {
      leftTop: { x: x1, y: y1 },
      rightBottom: { x: x2, y: y2 },
    } = mrv;
    const path = new Path2D();
    path.rect(
      x1 - padding,
      y1 - padding,
      x2 - x1 + padding * 2,
      y2 - y1 + padding * 2
    );
    return path;
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
  static rotate(center: Vec2 | MinRectVec, prev: Vec2, next: Vec2): DOMMatrix {
    let ct: Vec2;
    if (UtilTools.isVec2(center)) {
      ct = center;
    } else {
      ct = UtilTools.getMinRectCenter(center);
    }
    return new DOMMatrix()
      .translate(ct.x, ct.y)
      .rotate(UtilTools.getAngle(prev, next))
      .translate(-ct.x, -ct.y);
  }
  /** 縮放 */
  static scale(center: Vec2 | MinRectVec, prev: Vec2, next: Vec2): DOMMatrix {
    let ct: Vec2;
    if (UtilTools.isVec2(center)) {
      ct = center;
    } else {
      ct = UtilTools.getMinRectCenter(center);
    }
    return new DOMMatrix().scale(
      next.x / prev.x,
      next.y / prev.y,
      1,
      ct.x,
      ct.y
    );
  }

  /** 取得兩點間之弧度 */
  static getAngle(prev: Vec2, next: Vec2): number {
    const { x: x1, y: y1 } = prev,
      { x: x2, y: y2 } = next;
    return Math.atan2(y1 - y2, x1 - x2);
  }
}
