import { BaseTools } from "./management";
import { Board } from "..";
/** 鉛筆 */
export declare class PencilTools implements BaseTools {
    /** 繪製到 canvas 上 及 設定畫筆 */
    readonly board: Board;
    private drawStyle;
    /** 能包覆此圖形的最小矩形 */
    private minRect;
    /** 圖形路徑 */
    private path;
    constructor(board: Board, drawStyle?: Styles);
    onEventMoveInActive(v: Vec2): void;
    onDestroy(): void;
    changeStyle(s: Styles): void;
    onEventStart(v: Vec2): void;
    onEventMoveActive(v: Vec2): void;
    onEventEnd(v: Vec2): void;
    private settingPen;
    private draw;
    private addToBoard;
    private drawOver;
}
