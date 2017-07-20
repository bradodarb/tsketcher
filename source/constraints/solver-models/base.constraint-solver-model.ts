import { Param } from '../solver';

export class ConstraintResolver {

  public params;

  public static fixNaN(grad) {
    for (let i = 0; i < grad.length; i++) {
      if (isNaN(grad[i])) {
        grad[i] = 0;
      }
    }
  }
  public static rescale(grad, factor) {
    for (let i = 0; i < grad.length; i++) {
      grad[i] *= factor;
    }
  }
  constructor(params: Array<Param>) {
    this.params = params;
  }

  public error(): number {
    return 0;
  }

  public gradient(out: Array<number>): void {
    return undefined;
  }

  protected numericGradient(out) {
    const h = 1;
    const approx = (param) => {
      const fx = this.error();
      this.params[param].set(this.params[param].get() + h);
      const fhx = this.error();
      this.params[param].set(this.params[param].get() - h);
      return (fhx - fx) / h;
    };

    for (let i = 0; i < out.length; i++) {
      out[i] = approx(i);
    }
  }

}

