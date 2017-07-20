import { Angle } from '../solver-models/angle.constraint-solver-model';
import { ConstantWrapper } from '../solver-models/constant-wrapper.constraint-solver-model';
import { Diff } from '../solver-models/diff.constraint-solver-model';
import { EllipseTangent } from '../solver-models/ellipse-tangent.constraint-solver-model';
import { Equal } from '../solver-models/equal.constraint-solver-model';
import { EqualsTo } from '../solver-models/equals-to.constraint-solver-model';
import { GreaterThan } from '../solver-models/greater-than.constraint-solver-model';
import { LockConvex } from '../solver-models/lock-convex.constraint-solver-model';
import { MinLength } from '../solver-models/min-length.constraint-solver-model';
import { P2LDistance } from '../solver-models/p2LDistance.constraint-solver-model';
import { P2LDistanceSigned } from '../solver-models/p2lDistanceSigned.constraint-solver-model';
import { P2LDistanceV } from '../solver-models/p2lDistanceV.constraint-solver-model';
import { P2PDistance } from '../solver-models/p2pDistance.constraint-solver-model';
import { P2PDistanceV } from '../solver-models/p2pDistanceV.constraint-solver-model';
import { Parallel } from '../solver-models/parallel.constraint-solver-model';
import { Perpendicular } from '../solver-models/perpendicular.constraint-solver-model';
import { PointOnEllipse } from '../solver-models/pointOnEllipse.constraint-solver-model';

import { Param } from '../solver';

function ParentsCollector() {
  this.parents = [];
  const parents = this.parents;
  const index = {};
  function add(obj) {
    if (index[obj.id] === undefined) {
      index[obj.id] = obj;
      parents.push(obj);
    }
  }
  this.check = function (obj) {
    if (obj.parent !== null) {
      add(obj.parent);
    } else {
      add(obj);
    }
  };
}
/**
 * This intermediate layer should be eliminated since constraint server isn't used anymore
 */
function createByConstraintName(name: string, params: Array<Param>, values: Array<number>) {
  switch (name) {
    case 'equal':
      return new Equal(params);
    case 'equalsTo':
      return new EqualsTo(params, values[0]);
    case 'Diff':
      return new Diff(params, values[0]);
    case 'MinLength':
      return new MinLength(params, values[0]);
    case 'perpendicular':
      return new Perpendicular(params);
    case 'parallel':
      return new Parallel(params);
    case 'P2LDistanceSigned':
      return new P2LDistanceSigned(params, values[0]);
    case 'P2LDistance':
      return new P2LDistance(params, values[0]);
    case 'P2LDistanceV':
      return new P2LDistanceV(params);
    case 'P2PDistance':
      return new P2PDistance(params, values[0]);
    case 'P2PDistanceV':
      return new P2PDistanceV(params);
    case 'PointOnEllipse':
      return new PointOnEllipse(params);
    case 'EllipseTangent':
      return new EllipseTangent(params);
    case 'angle':
      return new Angle(params);
    case 'angleConst':
      const _ = true,
        x = false;
      // Exclude angle value from parameters
      return new ConstantWrapper(new Angle(params), [x, x, x, x, x, x, x, x, _]);
    case 'LockConvex':
      return new LockConvex(params);
    case 'GreaterThan':
      return new GreaterThan(params, values[0]);

  }
}


export {
  createByConstraintName,
  EqualsTo,
  ConstantWrapper,
  ParentsCollector
}
