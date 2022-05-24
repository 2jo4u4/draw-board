import { BaseShape, SocketMiddle, ToolsManagement } from ".";
interface ActionStore {
    type: "draw" | "delete";
    id: string;
}
export declare class Board {
    private __rootBlock;
    get rootBlock(): HTMLDivElement;
    private __canvas;
    get canvas(): HTMLCanvasElement;
    private __ctx;
    get ctx(): CanvasRenderingContext2D;
    private __canvasStatic;
    get canvasStatic(): HTMLCanvasElement;
    private __ctxStatic;
    get ctxStatic(): CanvasRenderingContext2D;
    private mouseFlag;
    private decivePixelPatio;
    shapes: Map<string, BaseShape>;
    shapesTrash: Map<string, BaseShape>;
    actionStore: ActionStore[];
    private __tools;
    get toolsCtrl(): ToolsManagement;
    private __socket;
    get socketCtrl(): SocketMiddle | null;
    constructor(canvas: HTMLCanvasElement | string, config?: {
        Socket?: SocketMiddle;
        Tools?: typeof ToolsManagement;
    });
    clearCanvas(type?: "static" | "event"): void;
    getShapeById(id: string): BaseShape | undefined;
    addShape(p: Path2D, s: Styles, m: MinRectVec): void;
    drawByPath(p: Path2D, s: Styles): void;
    drawByBs(bs: BaseShape): void;
    deleteShapeByID(...idArray: string[]): void;
    deleteShape(): void;
    private initial;
    destroy(): void;
    private setStaticCanvas;
    private addListener;
    private removeListener;
    private onEventStart;
    private onEventMove;
    private onEventEnd;
    private eventToPosition;
    private resizeCanvas;
    private setCanvasStyle;
    private settingChild;
}
export {};
