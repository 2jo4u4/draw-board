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

type ShapeActionType = "translate" | "rotate" | "scale";
