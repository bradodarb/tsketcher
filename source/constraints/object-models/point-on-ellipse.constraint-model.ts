import { PointOnEllipseInternal } from './point-on-ellipse-internal.constraint-model';

export class PointOnEllipse extends PointOnEllipseInternal {


  constructor(point, ellipse) {
    super(point, ellipse);
    this._name = 'PointOnEllipse';
  }

}
