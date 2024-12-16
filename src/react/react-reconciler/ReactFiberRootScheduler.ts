/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {Lane, Lanes} from './ReactFiberLane';
import type {PriorityLevel} from 'scheduler/src/SchedulerPriorities';
import type {BatchConfigTransition} from './ReactFiberTracingMarkerComponent';

import {
  disableLegacyMode,
  enableDeferRootSchedulingToMicrotask,
  disableSchedulerTimeoutInWorkLoop,
  enableProfilerTimer,
  enableProfilerNestedUpdatePhase,
  enableComponentPerformanceTrack,
  enableSiblingPrerendering,
} from 'shared/ReactFeatureFlags';
import {
  NoLane,
  NoLanes,
  SyncLane,
  getHighestPriorityLane,
  getNextLanes,
  includesSyncLane,
  markStarvedLanesAsExpired,
  claimNextTransitionLane,
  getNextLanesToFlushSync,
  checkIfRootIsPrerendering,
} from './ReactFiberLane';
import {
  CommitContext,
  NoContext,
  RenderContext,
  flushPassiveEffects,
  getExecutionContext,
  getWorkInProgressRoot,
  getWorkInProgressRootRenderLanes,
  isWorkLoopSuspendedOnData,
  performWorkOnRoot,
} from './ReactFiberWorkLoop';
import {LegacyRoot} from './ReactRootTags';
import {
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  cancelCallback as Scheduler_cancelCallback,
  scheduleCallback as Scheduler_scheduleCallback,
  now,
} from './Scheduler';
import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  lanesToEventPriority,
} from './ReactEventPriorities';
import {
  supportsMicrotasks,
  scheduleMicrotask,
  shouldAttemptEagerTransition,
  trackSchedulerEvent,
} from './ReactFiberConfig';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  resetNestedUpdateFlag,
  syncNestedUpdateFlag,
} from './ReactProfilerTimer';

// A linked list of all the roots with pending work. In an idiomatic app,
// there's only a single root, but we do support multi root apps, hence this
// extra complexity. But this module is optimized for the single root case.
let firstScheduledRoot: FiberRoot | null = null;
let lastScheduledRoot: FiberRoot | null = null;

// Used to prevent redundant mircotasks from being scheduled.
let didScheduleMicrotask: boolean = false;
// `act` "microtasks" are scheduled on the `act` queue instead of an actual
// microtask, so we have to dedupe those separately. This wouldn't be an issue
// if we required all `act` calls to be awaited, which we might in the future.
let didScheduleMicrotask_act: boolean = false;

// Used to quickly bail out of flushSync if there's no sync work to do.
let mightHavePendingSyncWork: boolean = false;

let isFlushingWork: boolean = false;

let currentEventTransitionLane: Lane = NoLane;

export function ensureRootIsScheduled(root: FiberRoot): void {
  // This function is called whenever a root receives an update. It does two
  // things 1) it ensures the root is in the root schedule, and 2) it ensures
  // there's a pending microtask to process the root schedule.
  //
  // Most of the actual scheduling logic does not happen until
  // `scheduleTaskForRootDuringMicrotask` runs.

  // Add the root to the schedule
  if (root === lastScheduledRoot || root.next !== null) {
    // Fast path. This root is already scheduled.
  } else {
    if (lastScheduledRoot === null) {
      firstScheduledRoot = lastScheduledRoot = root;
    } else {
      lastScheduledRoot.next = root;
      lastScheduledRoot = root;
    }
  }

  // Any time a root received an update, we set this to true until the next time
  // we process the schedule. If it's false, then we can quickly exit flushSync
  // without consulting the schedule.
  mightHavePendingSyncWork = true;

  // At the end of the current event, go through each of the roots and ensure
  // there's a task scheduled for each one at the correct priority.
  if (!didScheduleMicrotask) {
    didScheduleMicrotask = true;
    scheduleImmediateTask(processRootScheduleInMicrotask);
  }
}

// hc TODO 这个做什么的？
function processRootScheduleInMicrotask() {

  // This function is always called inside a microtask. It should never be
  // called synchronously.
  didScheduleMicrotask = false;

  // We'll recompute this as we iterate through all the roots and schedule them.
  mightHavePendingSyncWork = false;

  let syncTransitionLanes = NoLanes;

  const currentTime = now();

  let prev = null;
  let root = firstScheduledRoot;
  // hc TODO: 不知道这里是什么意思？
  // while (root !== null) {
  //   const next = root.next;
  //   const nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
  //   if (nextLanes === NoLane) {
  //     // This root has no more pending work. Remove it from the schedule. To
  //     // guard against subtle reentrancy bugs, this microtask is the only place
  //     // we do this — you can add roots to the schedule whenever, but you can
  //     // only remove them here.

  //     // Null this out so we know it's been removed from the schedule.
  //     root.next = null;
  //     if (prev === null) {
  //       // This is the new head of the list
  //       firstScheduledRoot = next;
  //     } else {
  //       prev.next = next;
  //     }
  //     if (next === null) {
  //       // This is the new tail of the list
  //       lastScheduledRoot = prev;
  //     }
  //   } else {
  //     // This root still has work. Keep it in the list.
  //     prev = root;

  //     // This is a fast-path optimization to early exit from
  //     // flushSyncWorkOnAllRoots if we can be certain that there is no remaining
  //     // synchronous work to perform. Set this to true if there might be sync
  //     // work left.
  //     if (
  //       // Skip the optimization if syncTransitionLanes is set
  //       syncTransitionLanes !== NoLanes ||
  //       // Common case: we're not treating any extra lanes as synchronous, so we
  //       // can just check if the next lanes are sync.
  //       includesSyncLane(nextLanes)
  //     ) {
  //       mightHavePendingSyncWork = true;
  //     }
  //   }
  //   root = next;
  // }

  // At the end of the microtask, flush any pending synchronous work. This has
  // to come at the end, because it does actual rendering work that might throw.
  // hc TODO 这里做什么的？
  // flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
}

function scheduleImmediateTask(cb: () => any) {

  // TODO: Can we land supportsMicrotasks? Which environments don't support it?
  // Alternatively, can we move this check to the host config?
  if (supportsMicrotasks) {
    scheduleMicrotask(() => {
      const executionContext = getExecutionContext();
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        // Note that this would still prematurely flush the callbacks
        // if this happens outside render or commit phase (e.g. in an event).

        // Intentionally using a macrotask instead of a microtask here. This is
        // wrong semantically but it prevents an infinite loop. The bug is
        // Safari's, not ours, so we just do our best to not crash even though
        // the behavior isn't completely correct.
        Scheduler_scheduleCallback(ImmediateSchedulerPriority, cb);
        return;
      }
      cb();
    });
  } else {
    // If microtasks are not supported, use Scheduler.
    // Scheduler_scheduleCallback(ImmediateSchedulerPriority, cb);
  }
}
