import { Board } from "..";
/**
 * 圖形基本類
 */
export declare class BaseShape {
    readonly $type = "base-shape";
    readonly id: string;
    readonly board: Board;
    readonly actionBar: ActionBar;
    /** 圖形路徑 */
    path: Path2D;
    /** 樣式 */
    style: Styles;
    /** 紀錄一個路徑的最小包覆矩形 */
    minRect: MinRectVec;
    /** 判斷是否被選取的路徑 */
    solidRectPath: Path2D;
    /** 是否被選取 */
    isSelect: boolean;
    constructor(id: string, board: Board, path: Path2D, style: Styles, minRect: MinRectVec);
    openSolidRect(config?: {
        mrv?: MinRectVec;
        openBar?: boolean;
    }): void;
    closeSolidRect(): void;
    /** 選取固定框設定 */
    private onSolidBoxStart;
}
declare type ActionBarTools = "delete" | "rotate";
/**
 * 選取後的控制欄位
 */
declare class ActionBar {
    readonly board: Board;
    readonly baseShape: BaseShape;
    private rootBlock;
    private block;
    private openFlag;
    constructor(board: Board, bs: BaseShape, use: ActionBarTools[]);
    private initial;
    openBar(mrv?: MinRectVec): void;
    closeBar(): void;
    private icon;
    private generateBtn;
}
export {};
