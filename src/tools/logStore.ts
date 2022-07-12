import type { Styles, BaseShape } from "..";
interface CommonLog {
  affectShape: BaseShape[];
}

interface AddShape extends CommonLog {}
interface DeleteShape extends CommonLog {}
interface TranslateShape extends CommonLog {}
export interface LogAction {
  addShape: AddShape;
  deleteShape: DeleteShape;
  deleteAllShape: DeleteShape;
  translateShape: TranslateShape;
}
interface StoreData {
  matrix: DOMMatrix;
  style: Styles;
  bs: BaseShape;
}

export class LogStore {
  private maxAmount = 10;
  private store: {
    type: keyof LogAction;
    data: StoreData[];
  }[];

  private pointIndex: number;

  constructor() {
    this.store = [];
    this.pointIndex = -1;
  }
  log<T extends keyof LogAction>(type: T, params: LogAction[T]) {
    if (this.pointIndex !== this.store.length - 1) {
      this.store = this.store.slice(0, this.pointIndex);
    }
    if (this.store.length === this.maxAmount) {
      const [trash, ...keep] = this.store;
      this.store = keep;
    }
    const data: StoreData[] = [];
    params.affectShape.forEach((bs) => {
      data.push({
        bs,
        matrix: bs.finallyMatrix,
        style: bs.style,
      });
    });
    this.store.push({ type, data });
    this.pointIndex = this.store.length - 1;
  }
  undo() {
    if (this.pointIndex >= 0) {
      const { type, data } = this.store[this.pointIndex];
      data.forEach(({ matrix, bs, style }) => {
        bs.matrix = matrix;
        bs.style = style;
        bs.isDelete = type === "addShape";
      });
      this.pointIndex -= 1;
      return { type, bss: data.map(({ bs }) => bs) };
    }
  }
  redo() {
    if (this.pointIndex < this.store.length - 1) {
      this.pointIndex += 1;
      const { type, data } = this.store[this.pointIndex];
      data.forEach(({ matrix, bs, style }) => {
        bs.matrix = matrix;
        bs.style = style;
        bs.isDelete = type === "deleteShape" || type === "deleteAllShape";
      });
      return { type, bss: data.map(({ bs }) => bs) };
    }
  }
}
