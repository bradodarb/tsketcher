import { Constraint } from './base.constraint-model';
import { Segment } from '../../geometry/render-models';

export class Vertical extends Constraint {

  public line: Segment;

  constructor(line) {
    super('Vertical', 'Vertical', true);
    this.line = line;
  }
  public getSolveData(resolver) {
    return [['equal', [this.line.a._x, this.line.b._x], []]];
  }

  public serialize() {
    return [this.NAME, [this.line.id]];
  }

  public getObjects() {
    return [this.line];
  }

}
