import { BaseShape, SocketMiddle, ToolsManagement } from ".";
interface ActionStore {
    type: "draw" | "delete";
    id: string;
}
/**
 * 繪圖板，介接各個插件
 */
export declare class Board {
    private __rootBlock;
    get rootBlock(): HTMLDivElement;
    /** Canvas網頁元素（事件層級） */
    private __canvas;
    get canvas(): HTMLCanvasElement;
    /** 繪版物件（事件層級）  */
    private __ctx;
    get ctx(): CanvasRenderingContext2D;
    /** 圖層級 */
    private __canvasStatic;
    get canvasStatic(): HTMLCanvasElement;
    private __ctxStatic;
    get ctxStatic(): CanvasRenderingContext2D;
    /** 滑鼠旗標（是否點擊） */
    private mouseFlag;
    /** 像素密度 */
    private decivePixelPatio;
    /** 所有被繪製的圖形 */
    shapes: Map<string, BaseShape>;
    /** 所有被刪除的圖形 */
    shapesTrash: Map<string, BaseShape>;
    /** 紀錄行為 */
    actionStore: ActionStore[];
    /** 工具包中間件 */
    private __tools;
    get toolsCtrl(): ToolsManagement;
    /** 網路請求中間件 */
    private __socket;
    get socketCtrl(): SocketMiddle | null;
    constructor(canvas: HTMLCanvasElement | string, config?: {
        Socket?: SocketMiddle;
        Tools?: typeof ToolsManagement;
    });
    /** 取得圖形物件 */
    getShapeById(id: string): BaseShape | undefined;
    /** 添加圖形 */
    addShape(p: Path2D, s: Styles, m: MinRectVec): void;
    deleteShapeByID(...idArray: string[]): void;
    deleteShape(): void;
    /** 初始化 canvas */
    private initial;
    /** 繪製到圖層級 */
    draw(p: Path2D, s: Styles): void;
    destroy(): void;
    private setStaticCanvas;
    private addListener;
    private removeListener;
    private onEventStart;
    private onEventMove;
    private onEventEnd;
    /** 事件轉換canvas座標 */
    private eventToPosition;
    private resizeCanvas;
    private setCanvasStyle;
    /** 調整使用者給予的 Canvas */
    private settingChild;
}
export {};
