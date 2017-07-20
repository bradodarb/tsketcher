import { ConstraintResolver } from './base.constraint-solver-model';


export class GreaterThan extends ConstraintResolver {

  public limit;

  constructor(params, limit) {
    super(params);
    this.limit = limit;
  }

  public error(): number {
    let value = this.params[0].get();
    const error = value <= this.limit ? this.limit - value : 0;
    return error;
  }

  public gradient(out: Array<number>): void {
    out[0] = -1;
  }

}
