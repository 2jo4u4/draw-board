export declare const defaultStyle: Styles;
export declare const padding = 8;
export declare const dashedLine: number[];
export declare class UtilTools {
    static generateMinRect(v1: Vec2, v2: Vec2): MinRectVec;
    static isVec2(v: Vec2 | MinRectVec): v is Vec2;
    static newMinRect(vec: Vec2, minRectVec: MinRectVec): MinRectVec;
    static mergeMinRect(...arge: MinRectVec[]): MinRectVec;
    static deepClone<T extends Object>(o: T): T;
    static isMouseEvent(event: TouchEvent | MouseEvent): event is MouseEvent;
    static RandomID(s?: string[]): string;
    static injectStyle(ctx: CanvasRenderingContext2D, s: Styles): void;
    static minRectToPath(mrv: MinRectVec, padding?: number): Path2D;
}
