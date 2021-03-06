import { EndPoint } from '../geometry/render-models';
import { Viewport2d } from '../viewport';
import { Tool } from './tool'

export class PointTool extends Tool {

  constructor(viewer: Viewport2d) {
    super('point', viewer);
  }

  restart() {
    this.sendSpecifyPointHint();
  }

  mouseup(e) {
    const input = this.viewer.screenToModel(e);
    this.processPointInput(input);
  }

  processCommand(command) {
    const result = Tool.parseVector(this.viewer.referencePoint, command);
    if (typeof result === 'string') {
      return result;
    }
    this.processPointInput(result);
  }

  processPointInput(input) {
    //  this.viewer.historyManager.checkpoint();
    const p = new EndPoint(input.x, input.y);
    const layer = this.viewer.activeLayer;
    layer.add(p);
    this.pointPicked(input.x, input.y);
    this.viewer.refresh();
    this.restart();
  }
}
