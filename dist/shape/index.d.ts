import { Board } from "..";
export declare class BaseShape {
    readonly $type: string;
    readonly id: string;
    readonly board: Board;
    path: Path2D;
    style: Styles;
    minRect: MinRectVec;
    bindingBox: Path2D;
    isSelect: boolean;
    regPosition: Vec2;
    startPosition: Vec2;
    constructor(id: string, board: Board, path: Path2D, style: Styles, minRect: MinRectVec);
    moveStart(v: Vec2): void;
    move(v: Vec2): void;
    moveEnd(v: Vec2): void;
    protected getOffset(prev: Vec2, next: Vec2): [number, number];
    private updataMinRect;
}
