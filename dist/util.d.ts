export declare const defaultStyle: Styles;
export declare const padding = 8;
export declare const dashedLine: number[];
/** 計算函式 / 工具函式 */
export declare class UtilTools {
    /** 揉合兩點座標成最小矩形 */
    static generateMinRect(v1: Vec2, v2: Vec2): MinRectVec;
    /** 是否為 Vec2 */
    static isVec2(v: Vec2 | MinRectVec): v is Vec2;
    /**
     * 計算新座標是否影響最小矩形
     * @param vec 座標
     * @param minRectVec 矩形座標
     * @returns 新矩形座標
     */
    static newMinRect(vec: Vec2, minRectVec: MinRectVec): MinRectVec;
    /**
     * 計算最小矩形 且 可包含所有傳入之矩形
     * @param arge 各個矩形
     * @returns 可包含所有矩形之最小矩形
     */
    static mergeMinRect(...arge: MinRectVec[]): MinRectVec;
    /** 深拷貝 */
    static deepClone<T extends Object>(o: T): T;
    /** 事件分辨 */
    static isMouseEvent(event: TouchEvent | MouseEvent): event is MouseEvent;
    /**
     * 隨機命名
     * @param s 已存在的ID陣列（可不傳遞 不保證ID是否唯一）
     * @returns
     */
    static RandomID(s?: string[]): string;
    /** 樣式注入 */
    static injectStyle(ctx: CanvasRenderingContext2D, s: Styles): void;
    /** 利用最小矩形產生路徑 */
    static drawMinRectVecPath(mrv: MinRectVec, padding?: number): Path2D;
}
