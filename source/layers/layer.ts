import LayerStyle from './layer-style';
import DefaultStyles from '../config/defaultStyles';
import { EndPoint, Segment } from '../geometry/render-models';

export default class Layer {


  public name: string;
  public style: LayerStyle;
  public stylesByRoles = {
    'construction': DefaultStyles.CONSTRUCTION_OF_OBJECT
  };
  public objects = [];
  public readOnly = false; // This is actually a mark for boundary layers coming from 3D

  constructor(name: string, style: LayerStyle) {
    this.name = name;
    this.style = style;
  }

  public remove(object) {
    const idx = this.objects.indexOf(object);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
      return true;
    }
    return false;
  }

  public add(object) {
    if (object.layer !== undefined) {
      if (object.layer != null) {
        object.layer.remove(object);
      }
      if (object.layer !== this) {
        this.objects.push(object);
        object.layer = this;
      }
    } else {
      this.objects.push(object);
    }
  }

  public addSegment(x1, y1, x2, y2) {
    const a = new EndPoint(x1, y1);
    const b = new EndPoint(x2, y2);
    const line = new Segment(a, b);
    this.add(line);
    return line;
  }

  public getStyleForObject(obj) {
    if (obj.style != null) {
      return obj.style;
    } else if (obj.role != null) {
      const style = this.stylesByRoles[obj.role];
      if (style) {
        return style;
      }
    }
    return this.style;
  }
}
