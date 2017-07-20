import { Constraint } from './object-models/base.constraint-model';
export class SubSystem {
  public alg = 1;
  public error = 0;
  public reduce = false;
  public constraints: Array<Constraint> = new Array<Constraint>();
}
