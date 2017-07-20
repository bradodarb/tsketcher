import { ConstraintResolver } from './base.constraint-solver-model';

const l1p1x = 0;
const l1p1y = 1;
const l1p2x = 2;
const l1p2y = 3;
const l2p1x = 4;
const l2p1y = 5;
const l2p2x = 6;
const l2p2y = 7;

export class Parallel extends ConstraintResolver {

  constructor(params) {
    super(params);

  }

  public error(): number {
    const dx1 = (this.params[l1p1x].get() - this.params[l1p2x].get());
    const dy1 = (this.params[l1p1y].get() - this.params[l1p2y].get());
    const dx2 = (this.params[l2p1x].get() - this.params[l2p2x].get());
    const dy2 = (this.params[l2p1y].get() - this.params[l2p2y].get());
    return (dx1 * dy2 - dy1 * dx2);
  }

  public gradient(out: Array<number>): void {
    out[l1p1x] = (this.params[l2p1y].get() - this.params[l2p2y].get());
    out[l1p2x] = -(this.params[l2p1y].get() - this.params[l2p2y].get());
    out[l1p1y] = -(this.params[l2p1x].get() - this.params[l2p2x].get());
    out[l1p2y] = (this.params[l2p1x].get() - this.params[l2p2x].get());
    out[l2p1x] = -(this.params[l1p1y].get() - this.params[l1p2y].get());
    out[l2p2x] = (this.params[l1p1y].get() - this.params[l1p2y].get());
    out[l2p1y] = (this.params[l1p1x].get() - this.params[l1p2x].get());
    out[l2p2y] = -(this.params[l1p1x].get() - this.params[l1p2x].get());
  }

}
