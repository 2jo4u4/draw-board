import { BaseShape } from ".";
import { Board } from "..";
export declare class SelectSolidRect extends BaseShape {
    readonly $type: string;
    readonly actionBar: ActionBar;
    shapes: BaseShape[];
    constructor(board: Board);
    settingAndOpen(mrv: MinRectVec, ...bsArray: BaseShape[]): void;
    setting(mrv: MinRectVec, ...bsArray: BaseShape[]): void;
    openSolidRect(mrv: MinRectVec): void;
    closeSolidRect(): void;
    moveStart(v: Vec2): void;
    move(v: Vec2): void;
    moveEnd(v: Vec2): void;
    private draw;
    private settingPath;
    private settingCtx;
}
declare type ActionBarTools = "delete" | "rotate";
declare class ActionBar {
    readonly board: Board;
    readonly baseShape: BaseShape;
    private rootBlock;
    private block;
    private openFlag;
    constructor(board: Board, bs: BaseShape, use: ActionBarTools[]);
    private initial;
    move(offset: [number, number]): void;
    openBar(mrv?: MinRectVec): void;
    closeBar(): void;
    private icon;
    private generateBtn;
}
export {};
