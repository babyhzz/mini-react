/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ReactNodeList } from '../shared/ReactTypes';
import type {
  Container,
  PublicInstance
} from './ReactFiberConfig';
import type { Lane } from './ReactFiberLane';
import type {
  Fiber,
  FiberRoot
} from './ReactInternalTypes';
import type { RootTag } from './ReactRootTags';

import { get as getInstance } from '../shared/ReactInstanceMap';
import {
  createUpdate,
  enqueueUpdate
} from './ReactFiberClassUpdateQueue';
import {
  getPublicInstance
} from './ReactFiberConfig';
import {
  emptyContextObject,
  findCurrentUnmaskedContext
} from './ReactFiberContext';
import { createFiberRoot } from './ReactFiberRoot';
import {
  findCurrentHostFiber
} from './ReactFiberTreeReflection';
import {
  requestUpdateLane,
  scheduleUpdateOnFiber
} from './ReactFiberWorkLoop';

function getContextForSubtree(
  parentComponent?: any,
): Object {
  if (!parentComponent) {
    return emptyContextObject;
  }

  const fiber = getInstance(parentComponent);
  // hc 是否无用？
  const parentContext = findCurrentUnmaskedContext(fiber);

  return parentContext;
}

function findHostInstance(component: Object): PublicInstance | null {
  const fiber = getInstance(component);
  if (fiber === undefined) {
    if (typeof component.render === 'function') {
      throw new Error('Unable to find node on an unmounted component.');
    } else {
      const keys = Object.keys(component).join(',');
      throw new Error(
        `Argument appears to not be a ReactComponent. Keys: ${keys}`,
      );
    }
  }
  const hostFiber = findCurrentHostFiber(fiber);
  if (hostFiber === null) {
    return null;
  }
  return getPublicInstance(hostFiber.stateNode);
}

export function createContainer(
  containerInfo: Container,
  tag: RootTag,
): FiberRoot {
  return createFiberRoot(
    containerInfo,
    tag,
    null
  );
}

export function updateContainer(
  element: ReactNodeList,
  container: FiberRoot,
  parentComponent?: any,
  callback?: Function | null,
): Lane {
  const current = container.current;
  const lane = requestUpdateLane(current);
  updateContainerImpl(
    current,
    lane,
    element,
    container,
    parentComponent,
    callback,
  );
  return lane;
}

function updateContainerImpl(
  rootFiber: Fiber,
  lane: Lane,
  element: ReactNodeList,
  container: FiberRoot,
  parentComponent?: any,
  callback?: Function | null,
): void {
  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(lane);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    // @ts-ignore hc
    update.callback = callback;
  }

  const root = enqueueUpdate(rootFiber, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, rootFiber, lane);
  }
}

export {
  batchedUpdates,
  deferredUpdates,
  discreteUpdates, flushPassiveEffects, flushSyncFromReconciler,
  flushSyncWork,
  isAlreadyRendering
};
