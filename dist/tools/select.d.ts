import { BaseTools } from "./management";
import { Board } from "..";
export declare class SelectTools implements BaseTools {
    readonly board: Board;
    private selectFlag;
    private startPosition;
    private selectSolidRect;
    constructor(board: Board);
    onDestroy(): void;
    onEventStart(v: Vec2): void;
    onEventMoveActive(v: Vec2): void;
    onEventMoveInActive(v: Vec2): void;
    onEventEnd(v: Vec2): void;
    private selectStart;
    private select;
    private selectEnd;
    private moveStart;
    private move;
    private moveEnd;
    private isSelected;
    private isInRectBlock;
    private settingFlexBox;
    private drawOverFlexBox;
}
