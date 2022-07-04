declare module "*.svg" {
  const content: string;
  export default content;
}

type ShapeActionType =
  | "translate" // 移動
  | "rotate" // 旋轉
  | "nw-scale" // 縮放左上
  | "ne-scale" // 縮放右上
  | "sw-scale" // 縮放左下
  | "se-scale"; // 縮放右下

type ManagerRole = "self" | "other" | string;
