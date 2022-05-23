import { BaseTools } from "./management";
import { Board } from "..";
/** 選擇器 */
export declare class SelectTools implements BaseTools {
    readonly board: Board;
    /** 選取狀態旗標 */
    private selectFlag;
    /** 紀錄滑鼠起點 */
    private startPosition;
    /** 紀錄固定的選取框（判定下次選取是否需要變更狀態） */
    private solidRect;
    constructor(board: Board);
    onEventMoveInActive(v: Vec2): void;
    onDestroy(): void;
    onEventStart(v: Vec2): void;
    onEventMoveActive(v: Vec2): void;
    onEventEnd(v: Vec2): void;
    /** 是否選中 */
    private isSelected;
    /** 範圍內是否選中 */
    private isInRectBlock;
    /** 選取的伸縮框設定 */
    private settingFlexBox;
    /** 繪製選取的伸縮框 */
    private drawFlexBox;
    /** 選取伸縮框結束 */
    private drawOverFlexBox;
}
