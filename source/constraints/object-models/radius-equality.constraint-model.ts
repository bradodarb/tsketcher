import { Constraint } from './base.constraint-model';
import { Arc } from '../../geometry/render-models';

export class RadiusEquality extends Constraint {

  public arc1: Arc;
  public arc2: Arc;

  constructor(arc1, arc2) {
    super('RR', 'Radius Equality');
    this.arc1 = arc1;
    this.arc2 = arc2;
  }
  public getSolveData(resolver) {
    return [['equal', [this.arc1.radius, this.arc2.radius], []]];
  }

  public serialize() {
    return [this.NAME, [this.arc1.id, this.arc2.id]];
  }

  public getObjects() {
    return [this.arc1, this.arc2];
  }

}
