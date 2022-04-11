import { BaseTools } from "./management";
import { Board } from "..";
import type { Styles, Vec2 } from "..";
/** 鉛筆 */
export declare class PencilTools implements BaseTools {
    private board;
    private drawStyle;
    private minRect;
    private path;
    constructor(board: Board);
    onDestroy(): void;
    changeStyle(s: Styles): void;
    onEventStart(v: Vec2): void;
    onEventMove(v: Vec2): void;
    onEventEnd(v: Vec2): void;
}
