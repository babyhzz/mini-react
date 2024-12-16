/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList, ReactFormState} from 'shared/ReactTypes';
import type {
  FiberRoot,
  SuspenseHydrationCallbacks,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {Cache} from './ReactFiberCacheComponent';

import {noTimeout} from './ReactFiberConfig';
import {
  NoLane,
  NoLanes,
  NoTimestamp,
  TotalLanes,
  createLaneMap,
} from './ReactFiberLane';
import {initializeUpdateQueue} from './ReactFiberClassUpdateQueue';
// import {LegacyRoot, ConcurrentRoot} from './ReactRootTags';
// import {createCache, retainCache} from './ReactFiberCacheComponent';
import { createHostRootFiber } from './ReactFiber';
import { Container } from './ReactFiberConfig';

export type RootState = {
  element: any,
};

function FiberRootNode(
  this: FiberRoot,
  containerInfo: Container,
  tag: RootTag,
) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  // @ts-ignore
  this.current = null;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.cancelPendingCommit = null;
  this.context = null;
  this.pendingContext = null;
  this.next = null;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  this.expirationTimes = createLaneMap(NoTimestamp);

  this.pendingLanes = NoLanes;
  // this.suspendedLanes = NoLanes;
  // this.pingedLanes = NoLanes;
  // this.warmLanes = NoLanes;
  // this.expiredLanes = NoLanes;
  // this.finishedLanes = NoLanes;
  // this.errorRecoveryDisabledLanes = NoLanes;
  // this.shellSuspendCounter = 0;

  this.entangledLanes = NoLanes;
  this.entanglements = createLaneMap(NoLanes);

  this.hiddenUpdates = createLaneMap(null);;
}

export function createFiberRoot(
  containerInfo: Container,
  tag: RootTag,
  initialChildren: ReactNodeList,
): FiberRoot {
  // @ts-ignore
  const root: FiberRoot = new FiberRootNode(
    containerInfo,
    tag,
  );

  // hc 创建HostRootFiber
  const uninitializedFiber = createHostRootFiber();
  const initialState: RootState = {
    element: initialChildren
  };
  uninitializedFiber.memoizedState = initialState;

  // hc 建立 FiberRoot 和 HostRootFiber 的关联关系
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
