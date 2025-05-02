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
  FiberRoot
} from './ReactInternalTypes';
import type { RootTag } from './ReactRootTags';

import { initializeUpdateQueue } from './ReactFiberClassUpdateQueue';
import { noTimeout } from './ReactFiberConfig';
import {
  NoLane,
  NoLanes,
  NoTimestamp,
  createLaneMap
} from './ReactFiberLane';
// import {LegacyRoot, ConcurrentRoot} from './ReactRootTags';
// import {createCache, retainCache} from './ReactFiberCacheComponent';
import { createHostRootFiber } from './ReactFiber';
import { Container } from './ReactFiberConfig';

export type RootState = {
  element: any,
  // TODO: 下面两个属性移除？
  isDehydrated?: boolean,
  cache?: Cache,
  // pendingSuspenseBoundaries: PendingSuspenseBoundaries | null,
  // transitions: Set<Transition> | null,
};

function FiberRootNode(
  this: FiberRoot,
  containerInfo: Container,
  tag: RootTag,
) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.current = null;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.cancelPendingCommit = null;
  this.context = null;
  this.pendingContext = null;
  this.next = null;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  this.eventTimes = createLaneMap(NoLanes);
  this.expirationTimes = createLaneMap(NoTimestamp);

  this.pendingLanes = NoLanes;
  // this.suspendedLanes = NoLanes;
  // this.pingedLanes = NoLanes;
  // this.warmLanes = NoLanes;
  this.expiredLanes = NoLanes;
  this.finishedLanes = NoLanes;
  // this.errorRecoveryDisabledLanes = NoLanes;
  // this.shellSuspendCounter = 0;

  // this.entangledLanes = NoLanes;
  // this.entanglements = createLaneMap(NoLanes);

  // this.hiddenUpdates = createLaneMap(null);;
}

export function createFiberRoot(
  containerInfo: Container,
  tag: RootTag,
  initialChildren: ReactNodeList,
): FiberRoot {
  const root: FiberRoot = new FiberRootNode(
    containerInfo,
    tag,
  );

  // hc 创建HostRootFiber
  const uninitializedFiber = createHostRootFiber();
  // hc 建立 FiberRoot 和 HostRootFiber 的关联关系
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  // hc initialChildren 为 null
  const initialState: RootState = {
    element: initialChildren
  };

  // hc HostRoot 的 memoizedState 存放要渲染的元素
  uninitializedFiber.memoizedState = initialState;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
