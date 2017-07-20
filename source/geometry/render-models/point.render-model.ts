import { DrawPoint } from '../utils';
import { Shape } from './shape.render-model';
import { Viewport2d } from '../../viewport';

export class Point extends Shape {

  public x = 0;
  public y = 0;
  public radius = 1;

  constructor(x, y, rad) {
    super('M4CAD.TWO.Point');
    this.x = x;
    this.y = y;
    this.radius = rad;
    this.style = null;
  }

  public draw(viewport: Viewport2d) {
    DrawPoint(viewport.context, this.x, this.y, this.radius, viewport.scale);
  }
}
