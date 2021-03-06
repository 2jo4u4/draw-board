declare module "*.svg" {
  const content: string;
  export default content;
}

interface MinRectVec {
  leftTop: Vec2;
  rightBottom: Vec2;
}
interface Styles {
  lineColor: string;
  lineWidth: number;
  fillColor?: string;
  lineDash?: number[];
}

interface Vec2 {
  x: number;
  y: number;
}

type ShapeActionType =
  | "translate" // 移動
  | "rotate" // 旋轉
  | "nw-scale" // 縮放左上
  | "ne-scale" // 縮放右上
  | "sw-scale" // 縮放左下
  | "se-scale"; // 縮放右下
