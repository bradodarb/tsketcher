import { ConstraintResolver } from './base.constraint-solver-model';

const _pcx = 0;
const _pcy = 1;
const _pax = 2;
const _pay = 3;
const _ptx = 4;
const _pty = 5;

export class LockConvex extends ConstraintResolver {

  constructor(params) {
    super(params);

  }

  public error(): number {
    const cx = this.params[_pcx].get();
    const cy = this.params[_pcy].get();
    const ax = this.params[_pax].get();
    const ay = this.params[_pay].get();
    const tx = this.params[_ptx].get();
    const ty = this.params[_pty].get();

    const crossProductNorm = (cx - ax) * (ty - ay) - (cy - ay) * (tx - ax);

    const violate = crossProductNorm < 0;
    return violate ? crossProductNorm : 0;
  }

  public gradient(out: Array<number>): void {
    const cx = this.params[_pcx].get();
    const cy = this.params[_pcy].get();
    const ax = this.params[_pax].get();
    const ay = this.params[_pay].get();
    const tx = this.params[_ptx].get();
    const ty = this.params[_pty].get();

    out[_pcx] = ty - ay;
    out[_pcy] = ax - tx;
    out[_pax] = cy - ty;
    out[_pay] = tx - cx;
    out[_ptx] = ay - cy;
    out[_pty] = cx - ax;
  }

}
