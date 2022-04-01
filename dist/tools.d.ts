import { Board, Styles, Vec2 } from ".";
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
/**
 * 控制插件
 */
export declare class ToolsManagement {
    private __toolsType;
    get toolsType(): ToolsEnum;
    /** 板子實例 */
    private board;
    private usingTools;
    constructor(board: Board);
    /** 觸摸/滑鼠下壓 */
    onEventStart(v: Vec2): void;
    /** 手指/滑鼠 移動過程 */
    onEventMove(v: Vec2): void;
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
