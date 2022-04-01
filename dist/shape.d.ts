import { Board, Vec2 } from ".";
export interface MinRectVec {
    leftTop: Vec2;
    rightBottom: Vec2;
}
export interface Styles {
    lineColor: string;
    lineWidth: number;
    fillColor?: string;
}
export declare const defaultStyle: Styles;
/**
 * 圖形基本類
 */
export declare class BaseShape {
    readonly $type = "base-shape";
    readonly id: string;
    path: Path2D;
    board: Board;
    style: Styles;
    /** 紀錄一個路徑的最小包覆矩形 */
    minRect: MinRectVec;
    /** 被選擇時的外框 */
    selectRectPath: Path2D;
    constructor(id: string, board: Board, path: Path2D, style: Styles, minRect: MinRectVec);
    isSelected(v: Vec2): Boolean;
    openSelectRect(): void;
}
