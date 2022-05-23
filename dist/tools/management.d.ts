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
/**
 * 控制插件
 */
export declare class ToolsManagement {
    private __toolsType;
    get toolsType(): ToolsEnum;
    /** 板子實例 */
    private board;
    /** 儲存當前選擇的工具 */
    private usingTools;
    constructor(board: Board);
    /** 觸摸/滑鼠下壓 */
    onEventStart(v: Vec2): void;
    /** 手指/滑鼠 移動過程(下壓時的移動過程) */
    onEventMoveActive(v: Vec2): void;
    /** 手指/滑鼠 移動過程(非下壓時的移動過程) */
    onEventMoveInActive(v: Vec2): void;
    /** 結束觸摸/滑鼠上提 抑或任何取消方式 */
    onEventEnd(v: Vec2): void;
    changePencilStyle(s: Styles): void;
    switchTypeTo(v: ToolsEnum): void;
    switchTypeToSelect(): void;
    switchTypeToPencil(): void;
    switchTypeToShapeGenerate(): void;
    switchTypeToTextRect(): void;
    switchTypeToEraser(): void;
}
