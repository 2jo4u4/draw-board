import { BaseTools } from "./management";
import { Board, Vec2 } from "..";
/** 選擇器 */
export declare class SelectTools implements BaseTools {
    private board;
    /** 選取狀態旗標 */
    private selectFlag;
    /** 選取前的畫面 */
    private beforeSelectScreen;
    /** 滑鼠起點 */
    private startPosition;
    constructor(board: Board);
    onEventStart(v: Vec2): void;
    onEventMove(v: Vec2): void;
    onEventEnd(v: Vec2): void;
}
