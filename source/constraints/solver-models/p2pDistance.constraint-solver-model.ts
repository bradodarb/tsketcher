import { ConstraintResolver } from './base.constraint-solver-model';

const p1x = 0;
const p1y = 1;
const p2x = 2;
const p2y = 3;

export class P2PDistance extends ConstraintResolver {

  public distance;
  constructor(params, distance) {
    super(params);
    this.distance = distance;
  }

  public error(): number {
    const dx = this.params[p1x].get() - this.params[p2x].get();
    const dy = this.params[p1y].get() - this.params[p2y].get();
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - this.distance);
  }

  public gradient(out: Array<number>): void {
    const dx = this.params[p1x].get() - this.params[p2x].get();
    const dy = this.params[p1y].get() - this.params[p2y].get();
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d === 0) {
      if (this.distance === 0) {
        return;
      }
      d = 0.000001;
    }
    out[p1x] = dx / d;
    out[p1y] = dy / d;
    out[p2x] = -dx / d;
    out[p2y] = -dy / d;
  }

}
