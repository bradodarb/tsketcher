import { getTextOffset } from '../utils';
import * as math from '../../math/math';
import Vector from '../../math/vector';
import { SketchObject } from './sketch-shape.render-model';
import { Viewport2d } from '../../viewport';

export class LinearDimension extends SketchObject {

  protected a;
  protected b;
  public flip: boolean;

  constructor(a, b, className = 'M4CAD.TWO.Dimension') {
    super(className);
    this.a = a;
    this.b = b;
    this.flip = false;
  }

  public collectParams(params) {
    return undefined;
  }

  public getReferencePoint() {
    return this.a;
  }



  public getA() { return this.a; }
  public getB() { return this.b; }

  public drawSelf(viewer: Viewport2d) {

    const off = 30 * viewer.dimScale;
    const textOff = getTextOffset(viewer.dimScale);

    let a, b, startA, startB;
    if (this.flip) {
      a = this.getB();
      b = this.getA();
      startA = this.b;
      startB = this.a;
    } else {
      a = this.getA();
      b = this.getB();
      startA = this.a;
      startB = this.b;
    }

    const d = math.distanceAB(a, b);

    let _vx = - (b.y - a.y);
    let _vy = b.x - a.x;

    //normalize
    const _vxn = _vx / d;
    const _vyn = _vy / d;

    _vx = _vxn * off;
    _vy = _vyn * off;

    viewer.context.beginPath();

    const _ax = a.x + _vx;
    const _ay = a.y + _vy;
    const _bx = b.x + _vx;
    const _by = b.y + _vy;

    viewer.context.moveTo(_ax, _ay);
    viewer.context.lineTo(_bx, _by);


    function drawRef(start, x, y) {
      const vec = new Vector(x - start.x, y - start.y);
      vec._normalize();
      vec._multiply(7 * viewer.dimScale);

      viewer.context.moveTo(start.x, start.y);
      viewer.context.lineTo(x, y);
      viewer.context.lineTo(x + vec.x, y + vec.y);
    }

    drawRef(startA, _ax, _ay);
    drawRef(startB, _bx, _by);

    viewer.context.closePath();
    viewer.context.stroke();

    function drawArrow(x, y) {
      const s1 = 50;
      const s2 = 20;
      viewer.context.lineCap = 'round';
      viewer.context.beginPath();
      viewer.context.moveTo(x, y);
      viewer.context.lineTo(x - s1, y - s2);
      viewer.context.closePath();
      viewer.context.stroke();
    }

    drawArrow(_ax, _ay);
    drawArrow(_bx, _by);

    viewer.context.font = (12 * viewer.dimScale) + 'px Arial';
    const txt = d.toFixed(2);
    const h = d / 2 - viewer.context.measureText(txt).width / 2;

    if (h > 0) {
      const tx = (_ax + _vxn * textOff) - (- _vyn) * h;
      const ty = (_ay + _vyn * textOff) - (_vxn) * h;
      viewer.context.save();
      viewer.context.translate(tx, ty);
      viewer.context.rotate(- Math.atan2(_vxn, _vyn));
      viewer.context.scale(1, -1);
      viewer.context.fillText(txt, 0, 0);
      viewer.context.restore();
    }
  }

  public normalDistance(aim) {
    return -1;
  }
}
