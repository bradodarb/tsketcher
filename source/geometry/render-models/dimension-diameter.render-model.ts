import Vector from '../../math/vector';
import { SketchObject } from './sketch-shape.render-model';
import { Circle } from './circle.render-model';
import { Arc } from './arc.render-model';
import { getTextOffset } from '../utils';
import { Viewport2d } from '../../viewport';


export class DiameterDimension extends SketchObject {

  public obj: SketchObject;
  public angle: number;

  constructor(obj) {
    super('M4CAD.TWO.DiameterDimension');
    this.obj = obj;
    this.angle = Math.PI / 4;
  }

  public collectParams(params) {
    return undefined;
  }

  public getReferencePoint() {
    return undefined;
  }

  public translateSelf(dx, dy) {
    return undefined;
  }

  public drawSelf(viewer: Viewport2d) {
    if (this.obj == null) {
      return;
    }
    if (this.obj.className === 'M4CAD.TWO.Circle') {
      this.drawForCircle(viewer);
    } else if (this.obj.className === 'M4CAD.TWO.Arc') {
      this.drawForArc(viewer);
    }
  }

  public drawForCircle(viewer: Viewport2d) {
    const circle = this.obj as Circle;
    const c = new Vector().setV(circle.center);
    const r = circle.radius.get();
    const angled = new Vector(r * Math.cos(this.angle), r * Math.sin(this.angle), 0);
    const a = c.minus(angled);
    const b = c.plus(angled);
    const textOff = getTextOffset(viewer.dimScale);

    const d = 2 * r;

    viewer.context.beginPath();
    viewer.context.moveTo(a.x, a.y);
    viewer.context.lineTo(b.x, b.y);
    viewer.context.closePath();
    viewer.context.stroke();

    const fontSize = 12 * viewer.dimScale;
    viewer.context.font = (fontSize) + 'px Arial';
    const txt = String.fromCharCode(216) + ' ' + d.toFixed(2);
    const textWidth = viewer.context.measureText(txt).width;
    const h = d / 2 - textWidth / 2;

    const _vx = - (b.y - a.y);
    const _vy = b.x - a.x;

    //normalize
    const _vxn = _vx / d;
    const _vyn = _vy / d;

    function drawText(tx, ty) {
      viewer.context.save();
      viewer.context.translate(tx, ty);
      viewer.context.rotate(-Math.atan2(_vxn, _vyn));
      viewer.context.scale(1, -1);
      viewer.context.fillText(txt, 0, 0);
      viewer.context.restore();
    }

    let tx, ty;
    if (h - fontSize * .3 > 0) { // take into account font size to not have circle overlap symbols
      tx = (a.x + _vxn * textOff) - (-_vyn) * h;
      ty = (a.y + _vyn * textOff) - (_vxn) * h;
      drawText(tx, ty);
    } else {
      const off = 2 * viewer.dimScale;
      angled._normalize();
      const extraLine = angled.multiply(textWidth + off * 2);
      viewer.context.beginPath();
      viewer.context.moveTo(b.x, b.y);
      viewer.context.lineTo(b.x + extraLine.x, b.y + extraLine.y);
      viewer.context.closePath();
      viewer.context.stroke();
      angled._multiply(off);

      tx = (b.x + _vxn * textOff) + angled.x;
      ty = (b.y + _vyn * textOff) + angled.y;
      drawText(tx, ty);
    }
  }

  public drawForArc(viewer: Viewport2d) {

    const arc = this.obj as Arc;
    const r = arc.distanceA();

    const hxn = Math.cos(this.angle);
    const hyn = Math.sin(this.angle);

    const vxn = - hyn;
    const vyn = hxn;

    //fix angle if needed
    if (!arc.isPointInsideSector(arc.center.x + hxn, arc.center.y + hyn)) {
      const cosA = hxn * (arc.a.x - arc.center.x) + hyn * (arc.a.y - arc.center.y);
      const cosB = hxn * (arc.b.x - arc.center.x) + hyn * (arc.b.y - arc.center.y);
      if (cosA - hxn > cosB - hxn) {
        this.angle = arc.getStartAngle();
      } else {
        this.angle = arc.getEndAngle();
      }
    }

    const vertOff = getTextOffset(viewer.dimScale);
    const horOff = 5 * viewer.dimScale;

    const fontSize = 12 * viewer.dimScale;
    viewer.context.font = (fontSize) + 'px Arial';
    const txt = 'R ' + r.toFixed(2);
    const textWidth = viewer.context.measureText(txt).width;

    const startX = arc.center.x + hxn * r;
    const startY = arc.center.y + hyn * r;
    const lineLength = textWidth + horOff * 2;

    viewer.context.beginPath();
    viewer.context.moveTo(startX, startY);
    viewer.context.lineTo(startX + hxn * lineLength, startY + hyn * lineLength);
    viewer.context.closePath();
    viewer.context.stroke();

    const tx = startX + vxn * vertOff + hxn * horOff;
    const ty = startY + vyn * vertOff + hyn * horOff;
    viewer.context.save();
    viewer.context.translate(tx, ty);
    viewer.context.rotate(-Math.atan2(vxn, vyn));
    viewer.context.scale(1, -1);
    viewer.context.fillText(txt, 0, 0);
    viewer.context.restore();
  }

  public normalDistance(aim) {
    return -1;
  }
}
