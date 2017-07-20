import { ConstraintResolver } from './base.constraint-solver-model';

const p1x = 0;
const p1y = 1;
const p2x = 2;
const p2y = 3;
const D = 4;


export class P2PDistanceV extends ConstraintResolver {

  constructor(params) {
    super(params);

  }

  public error(): number {
    const dx = this.params[p1x].get() - this.params[p2x].get();
    const dy = this.params[p1y].get() - this.params[p2y].get();
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - this.params[D].get());
  }

  public gradient(out: Array<number>): void {
    const dx = this.params[p1x].get() - this.params[p2x].get();
    const dy = this.params[p1y].get() - this.params[p2y].get();
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d === 0) {
      if (this.params[D].get() === 0) {
        return;
      }
      d = 0.000001;
    }
    out[p1x] = dx / d;
    out[p1y] = dy / d;
    out[p2x] = -dx / d;
    out[p2y] = -dy / d;
    out[D] = -1;
  }

}
