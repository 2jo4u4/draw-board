import { Board } from "..";
export declare enum ToolsEnum {
    "選擇器" = "select",
    "鉛筆" = "pencil",
    "圖形生成" = "shapeGenerate",
    "擦子" = "eraser",
    "文字框" = "textRect"
}
export declare enum LineWidth {
    "細" = 1,
    "一般" = 2,
    "粗" = 4
}
export declare abstract class BaseTools {
    constructor(board: Board);
    onEventStart(v: Vec2): void;
    onEventMoveActive(v: Vec2): void;
    onEventMoveInActive(v: Vec2): void;
    onEventEnd(v: Vec2): void;
    onDestroy(): void;
}
export declare class ToolsManagement {
    private __toolsType;
    get toolsType(): ToolsEnum;
    private board;
    private usingTools;
    constructor(board: Board);
    onEventStart(v: Vec2): void;
    onEventMoveActive(v: Vec2): void;
    onEventMoveInActive(v: Vec2): void;
    onEventEnd(v: Vec2): void;
    changePencilStyle(s: Styles): void;
    switchTypeTo(v: ToolsEnum): void;
    switchTypeToSelect(): void;
    switchTypeToPencil(): void;
    switchTypeToShapeGenerate(): void;
    switchTypeToTextRect(): void;
    switchTypeToEraser(): void;
}
