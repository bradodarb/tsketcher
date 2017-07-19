import { Constraint } from './base.constraint-model';
import { Segment } from '../../geometry/render-models';

export class Horizontal extends Constraint {

  public line: Segment;

  constructor(line) {
    super('Horizontal', 'Horizontal', true);
    this.line = line;
  }
  public getSolveData(resolver) {
    return [['equal', [this.line.a._y, this.line.b._y], []]];
  }

  public serialize() {
    return [this.NAME, [this.line.id]];
  }

  public getObjects() {
    return [this.line];
  }

}
