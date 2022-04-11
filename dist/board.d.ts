import { BaseShape, SocketMiddle, ToolsManagement } from ".";
import type { Styles, MinRectVec } from ".";
/**
 * 繪圖板，介接各個插件
 */
export declare class Board {
    /** Canvas網頁元素 */
    private __canvas;
    get canvas(): HTMLCanvasElement;
    /** 繪版物件 */
    private __ctx;
    get ctx(): CanvasRenderingContext2D;
    /** 滑鼠旗標（是否點擊） */
    private mouseFlag;
    /** 像素密度 */
    private decivePixelPatio;
    /** 所有被繪製的圖形 */
    shapes: Map<string, BaseShape>;
    /** 紀錄繪圖行為 */
    store: ImageData[];
    /** 工具包中間件 */
    private __tools;
    get toolsCtrl(): ToolsManagement;
    /** 網路請求中間件 */
    private __socket;
    get socketCtrl(): SocketMiddle | null;
    constructor(canvasEl: HTMLElement, config?: {
        Socket?: SocketMiddle;
        Tools?: typeof ToolsManagement;
    });
    getShapeById(id: string): BaseShape | undefined;
    /** 可復原 */
    addShape(p: Path2D, s: Styles, m: MinRectVec): void;
    initial(): void;
    destroy(): void;
    /** 可復原 */
    updata(p: Path2D): void;
    saveCanvas(): void;
    resumeCanvas(): void;
    private addListener;
    private removeListener;
    private onEventStart;
    private onEventMove;
    private onEventEnd;
    /** 事件轉換座標 */
    private eventToPosition;
    private resizeCanvas;
}
