import { Constraint } from './base.constraint-model';
import { Arc } from '../../geometry/render-models';

export class Radius extends Constraint {

  public static SettableFields = { 'd': 'Enter the radius value' };
  public arc: Arc;
  public d;



  constructor(arc, d) {
    super('Radius', 'Radius Value');
    this.arc = arc;
    this.d = d;
  }
  public getSolveData(resolver) {
    return [['equalsTo', [this.arc.radius], [resolver(this.d)]]];
  }

  public serialize() {
    return [this.NAME, [this.arc.id, this.d]];
  }

  public getObjects() {
    return [this.arc];
  }

}
