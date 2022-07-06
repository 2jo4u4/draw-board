interface CommonLog {
  affectShape: string[];
}

interface TranslateLog extends CommonLog {
  matrix: DOMMatrix;
}
export interface LogAction {
  addShape: CommonLog;
  deleteShape: CommonLog;
  translateShape: TranslateLog;
}

export class LogStore {
  private maxAmount = 10;
  private store: [];

  constructor() {
    this.store = [];
  }
  log<T extends keyof LogAction>(type: T, params: LogAction[T]) {}
  undo() {}
  redo() {}
}
