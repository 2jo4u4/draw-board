import { BaseTools } from "./management";
import { Board } from "..";
export declare class PencilTools implements BaseTools {
    readonly board: Board;
    private drawStyle;
    private minRect;
    private path;
    constructor(board: Board, drawStyle?: Styles);
    onDestroy(): void;
    changeStyle(s: Styles): void;
    onEventStart(v: Vec2): void;
    onEventMoveActive(v: Vec2): void;
    onEventMoveInActive(v: Vec2): void;
    onEventEnd(v: Vec2): void;
    private settingPen;
    private draw;
    private addToBoard;
    private drawOver;
}
