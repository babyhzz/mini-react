/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ReactNodeList } from "../shared/ReactTypes";
import type { Container } from "./ReactFiberConfig";
import type { Lane } from "./ReactFiberLane";
import type { FiberRoot } from "./ReactInternalTypes";
import type { RootTag } from "./ReactRootTags";

import { get as getInstance } from "../shared/ReactInstanceMap";
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { emptyContextObject } from "./ReactFiberContext";
import { createFiberRoot } from "./ReactFiberRoot";
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

function getContextForSubtree(
  parentComponent?: any,
): Object {
  return emptyContextObject;

  // hc 这里注释掉，不做context处理
  // if (!parentComponent) {
  //   return emptyContextObject;
  // }

  // const fiber = getInstance(parentComponent);
  // const parentContext = findCurrentUnmaskedContext(fiber);

  // if (fiber.tag === ClassComponent) {
  //   const Component = fiber.type;
  //   if (isLegacyContextProvider(Component)) {
  //     return processChildContext(fiber, Component, parentContext);
  //   }
  // }

  // return parentContext;
}

function findHostInstance(component: Object): PublicInstance | null {
  const fiber = getInstance(component);
  if (fiber === undefined) {
    if (typeof component.render === "function") {
      throw new Error("Unable to find node on an unmounted component.");
    } else {
      const keys = Object.keys(component).join(",");
      throw new Error(
        `Argument appears to not be a ReactComponent. Keys: ${keys}`
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
  tag: RootTag
): FiberRoot {
  return createFiberRoot(containerInfo, tag, null);
}

export function updateContainer(
  element: ReactNodeList,
  container: FiberRoot,
  parentComponent?: any,
  callback?: Function | null
): Lane {
  const current = container.current;

  // ? 这个时间用来做什么的？
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  // hc: context 相关注释掉先
  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(eventTime, lane);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = { element };

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    // @ts-ignore hc
    update.callback = callback;
  }

  const root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane, eventTime);
  }

  return lane;
}

export { };

