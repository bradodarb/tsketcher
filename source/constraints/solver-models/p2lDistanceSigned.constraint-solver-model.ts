import { ConstraintResolver } from './base.constraint-solver-model';

const TX = 0;
const TY = 1;
const AX = 2;
const AY = 3;
const BX = 4;
const BY = 5;

export class P2LDistanceSigned extends ConstraintResolver {

  public value;

  constructor(params, value) {
    super(params);
    this.value = value;
  }

  public error(): number {
    const tx = this.params[TX].get(),
      ax = this.params[AX].get(),
      bx = this.params[BX].get();
    const ty = this.params[TY].get(),
      ay = this.params[AY].get(),
      by = this.params[BY].get();
    const d = Math.sqrt(Math.pow(by - ay, 2) + Math.pow(bx - ax, 2));

    return (-(by - ay) * (tx - ax)) / d + ((bx - ax) * (ty - ay)) / d - this.value;
  }

  public gradient(out: Array<number>): void {

    super.numericGradient(out);

  }
}
