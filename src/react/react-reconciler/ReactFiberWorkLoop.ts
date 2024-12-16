/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { REACT_STRICT_MODE_TYPE } from "shared/ReactSymbols";

import type { Wakeable, Thenable } from "shared/ReactTypes";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import type { Lanes, Lane } from "./ReactFiberLane";
import type { SuspenseState } from "./ReactFiberSuspenseComponent";
import type { FunctionComponentUpdateQueue } from "./ReactFiberHooks";
import type { EventPriority } from "./ReactEventPriorities";
import type {
  PendingTransitionCallbacks,
  PendingBoundaries,
  Transition,
  TransitionAbort,
} from "./ReactFiberTracingMarkerComponent";
import type { OffscreenInstance } from "./ReactFiberActivityComponent";
import type { Resource } from "./ReactFiberConfig";

import ReactSharedInternals from "shared/ReactSharedInternals";
import is from "shared/objectIs";

import {
  // Aliased because `act` will override and push to an internal queue
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  requestPaint,
  now,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from "./Scheduler";
import {
  logCommitStarted,
  logCommitStopped,
  logLayoutEffectsStarted,
  logLayoutEffectsStopped,
  logPassiveEffectsStarted,
  logPassiveEffectsStopped,
  logRenderStarted,
  logRenderStopped,
} from "./DebugTracing";
import {
  logBlockingStart,
  logTransitionStart,
  logRenderPhase,
  logInterruptedRenderPhase,
  logSuspendedRenderPhase,
  logErroredRenderPhase,
  logInconsistentRender,
  logSuspendedWithDelayPhase,
  logSuspenseThrottlePhase,
  logSuspendedCommitPhase,
  logCommitPhase,
  logPaintYieldPhase,
  logPassiveCommitPhase,
  logYieldTime,
  logActionYieldTime,
  logSuspendedYieldTime,
  setCurrentTrackFromLanes,
  markAllLanesInOrder,
} from "./ReactFiberPerformanceTrack";

import {
  resetAfterCommit,
  scheduleTimeout,
  cancelTimeout,
  noTimeout,
  afterActiveInstanceBlur,
  startSuspendingCommit,
  waitForCommitToBeReady,
  preloadInstance,
  preloadResource,
  supportsHydration,
  setCurrentUpdatePriority,
  getCurrentUpdatePriority,
  trackSchedulerEvent,
} from "./ReactFiberConfig";

import { resolveUpdatePriority } from "../react-dom-binding/ReactDOMUpdatePriority";

import { createWorkInProgress, resetWorkInProgress } from "./ReactFiber";
import { isRootDehydrated } from "./ReactFiberShellHydration";
import { getIsHydrating } from "./ReactFiberHydrationContext";
import {
  NoMode,
  ProfileMode,
  ConcurrentMode,
  StrictLegacyMode,
  StrictEffectsMode,
  NoStrictPassiveEffectsMode,
} from "./ReactTypeOfMode";
import {
  HostRoot,
  ClassComponent,
  SuspenseComponent,
  SuspenseListComponent,
  OffscreenComponent,
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
  HostComponent,
  HostHoistable,
  HostSingleton,
} from "./ReactWorkTags";
import { ConcurrentRoot, LegacyRoot } from "./ReactRootTags";
import type { Flags } from "./ReactFiberFlags";
import {
  NoFlags,
  Incomplete,
  StoreConsistency,
  HostEffectMask,
  ForceClientRender,
  BeforeMutationMask,
  MutationMask,
  LayoutMask,
  PassiveMask,
  PlacementDEV,
  Visibility,
  MountPassiveDev,
  MountLayoutDev,
  DidDefer,
  ShouldSuspendCommit,
  MaySuspendCommit,
  ScheduleRetry,
} from "./ReactFiberFlags";
import {
  NoLanes,
  NoLane,
  SyncLane,
  claimNextRetryLane,
  includesSyncLane,
  isSubsetOfLanes,
  mergeLanes,
  removeLanes,
  pickArbitraryLane,
  includesNonIdleWork,
  includesOnlyRetries,
  includesOnlyTransitions,
  includesBlockingLane,
  includesTransitionLane,
  includesExpiredLane,
  getNextLanes,
  getEntangledLanes,
  getLanesToRetrySynchronouslyOnError,
  upgradePendingLanesToSync,
  markRootSuspended as _markRootSuspended,
  markRootUpdated as _markRootUpdated,
  markRootPinged as _markRootPinged,
  markRootFinished,
  addFiberToLanesMap,
  movePendingFibersToMemoized,
  addTransitionToLanesMap,
  getTransitionsForLanes,
  includesSomeLane,
  OffscreenLane,
  SyncUpdateLanes,
  UpdateLanes,
  claimNextTransitionLane,
  checkIfRootIsPrerendering,
} from "./ReactFiberLane";
import {
  DiscreteEventPriority,
  DefaultEventPriority,
  lowerEventPriority,
  lanesToEventPriority,
  eventPriorityToLane,
} from "./ReactEventPriorities";
import { requestCurrentTransition } from "./ReactFiberTransition";
import {
  SelectiveHydrationException,
  beginWork,
  replayFunctionComponent,
} from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { unwindWork, unwindInterruptedWork } from "./ReactFiberUnwindWork";
import {
  throwException,
  createRootErrorUpdate,
  createClassErrorUpdate,
  initializeClassErrorUpdate,
} from "./ReactFiberThrow";
import {
  commitBeforeMutationEffects,
  commitLayoutEffects,
  commitMutationEffects,
  commitPassiveMountEffects,
  commitPassiveUnmountEffects,
  disappearLayoutEffects,
  reconnectPassiveEffects,
  reappearLayoutEffects,
  disconnectPassiveEffect,
  invokeLayoutEffectMountInDEV,
  invokePassiveEffectMountInDEV,
  invokeLayoutEffectUnmountInDEV,
  invokePassiveEffectUnmountInDEV,
  accumulateSuspenseyCommit,
} from "./ReactFiberCommitWork";
import { enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { resetContextDependencies } from "./ReactFiberNewContext";
import {
  resetHooksAfterThrow,
  resetHooksOnUnwind,
  ContextOnlyDispatcher,
} from "./ReactFiberHooks";
import { DefaultAsyncDispatcher } from "./ReactFiberAsyncDispatcher";
import {
  createCapturedValueAtFiber,
  type CapturedValue,
} from "./ReactCapturedValue";
import {
  enqueueConcurrentRenderForLane,
  finishQueueingConcurrentUpdates,
  getConcurrentlyUpdatedLanes,
} from "./ReactFiberConcurrentUpdates";

import {
  blockingClampTime,
  blockingUpdateTime,
  blockingEventTime,
  blockingEventType,
  blockingEventIsRepeat,
  blockingSuspendedTime,
  transitionClampTime,
  transitionStartTime,
  transitionUpdateTime,
  transitionEventTime,
  transitionEventType,
  transitionEventIsRepeat,
  transitionSuspendedTime,
  clearBlockingTimers,
  clearTransitionTimers,
  clampBlockingTimers,
  clampTransitionTimers,
  markNestedUpdateScheduled,
  renderStartTime,
  commitStartTime,
  commitEndTime,
  recordRenderTime,
  recordCommitTime,
  recordCommitEndTime,
  startProfilerTimer,
  stopProfilerTimerIfRunningAndRecordDuration,
  stopProfilerTimerIfRunningAndRecordIncompleteDuration,
  trackSuspendedTime,
  startYieldTimer,
  yieldStartTime,
  yieldReason,
  startPingTimerByLanes,
} from "./ReactProfilerTimer";

// DEV stuff
import getComponentNameFromFiber from "react-reconciler/src/getComponentNameFromFiber";
import ReactStrictModeWarnings from "./ReactStrictModeWarnings";
import {
  isRendering as ReactCurrentDebugFiberIsRenderingInDEV,
  resetCurrentFiber,
  runWithFiberInDEV,
} from "./ReactCurrentFiber";
import {
  isDevToolsPresent,
  markCommitStarted,
  markCommitStopped,
  markComponentRenderStopped,
  markComponentSuspended,
  markComponentErrored,
  markLayoutEffectsStarted,
  markLayoutEffectsStopped,
  markPassiveEffectsStarted,
  markPassiveEffectsStopped,
  markRenderStarted,
  markRenderYielded,
  markRenderStopped,
  onCommitRoot as onCommitRootDevTools,
  onPostCommitRoot as onPostCommitRootDevTools,
  setIsStrictModeForDevtools,
} from "./ReactFiberDevToolsHook";
import { onCommitRoot as onCommitRootTestSelector } from "./ReactTestSelectors";
import { releaseCache } from "./ReactFiberCacheComponent";
import {
  isLegacyActEnvironment,
  isConcurrentActEnvironment,
} from "./ReactFiberAct";
import { processTransitionCallbacks } from "./ReactFiberTracingMarkerComponent";
import {
  SuspenseException,
  SuspenseActionException,
  SuspenseyCommitException,
  getSuspendedThenable,
  isThenableResolved,
} from "./ReactFiberThenable";
import { schedulePostPaintCallback } from "./ReactPostPaintCallback";
import {
  getSuspenseHandler,
  getShellBoundary,
} from "./ReactFiberSuspenseContext";
import { resolveDefaultPropsOnNonClassComponent } from "./ReactFiberLazyComponent";
import { resetChildReconcilerOnUnwind } from "./ReactChildFiber";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { getMaskedContext, getUnmaskedContext } from "./ReactFiberContext";
import { peekEntangledActionLane } from "./ReactFiberAsyncAction";
import { logUncaughtError } from "./ReactFiberErrorLogger";

const PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const RootInProgress = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootSuspendedAtTheShell = 6;
const RootCompleted = 5;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;
// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

// Tracks whether any siblings were skipped during the unwind phase after
// something suspends. Used to determine whether to schedule another render
// to prewarm the skipped siblings.
let workInProgressRootDidSkipSuspendedSiblings: boolean = false;
// Whether the work-in-progress render is the result of a prewarm/prerender.
// This tells us whether or not we should render the siblings after
// something suspends.
let workInProgressRootIsPrerendering: boolean = false;

// Whether a ping listener was attached during this render. This is slightly
// different that whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).
let workInProgressRootDidAttachPingListener: boolean = false;

// A contextual version of workInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with entangledRenderLanes.
export let entangledRenderLanes: Lanes = NoLanes;

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootInProgress;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootInterleavedUpdatedLanes: Lanes = NoLanes;
// Lanes that were updated during the render phase (*not* an interleaved event).
let workInProgressRootRenderPhaseUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;
// If this render scheduled deferred work, this is the lane of the deferred task.
let workInProgressDeferredLane: Lane = NoLane;
// Represents the retry lanes that were spawned by this render and have not
// been pinged since, implying that they are still suspended.
let workInProgressSuspendedRetryLanes: Lanes = NoLanes;
// Errors that are thrown during the render phase.
let workInProgressRootConcurrentErrors: Array<CapturedValue<mixed>> | null =
  null;
// These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.
let workInProgressRootRecoverableErrors: Array<CapturedValue<mixed>> | null =
  null;

// Tracks when an update occurs during the render phase.
let workInProgressRootDidIncludeRecursiveRenderUpdate: boolean = false;
// Thacks when an update occurs during the commit phase. It's a separate
// variable from the one for renders because the commit phase may run
// concurrently to a render phase.
let didIncludeCommitPhaseUpdate: boolean = false;

// The most recent time we either committed a fallback, or when a fallback was
// filled in with the resolved UI. This lets us throttle the appearance of new
// content as it streams in, to minimize jank.
// TODO: Think of a better name for this variable?
let globalMostRecentFallbackTime: number = 0;
const FALLBACK_THROTTLE_MS: number = 300;

// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime: number = Infinity;
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
const RENDER_TIMEOUT_MS = 500;

function resetRenderTimer() {
  workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS;
}

export function getRenderTargetTime(): number {
  return workInProgressRootRenderTargetTime;
}

let legacyErrorBoundariesThatAlreadyFailed: Set<mixed> | null = null;

let rootDoesHavePassiveEffects: boolean = false;
let rootWithPendingPassiveEffects: FiberRoot | null = null;
let pendingPassiveEffectsLanes: Lanes = NoLanes;
let pendingPassiveEffectsRemainingLanes: Lanes = NoLanes;
let pendingPassiveEffectsRenderEndTime: number = -0; // Profiling-only
let pendingPassiveTransitions: Array<Transition> | null = null;

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;
let isFlushingPassiveEffects = false;
let didScheduleUpdateDuringPassiveEffects = false;

const NESTED_PASSIVE_UPDATE_LIMIT = 50;
let nestedPassiveUpdateCount: number = 0;
let rootWithPassiveNestedUpdates: FiberRoot | null = null;

let isRunningInsertionEffect = false;

export function getWorkInProgressRoot(): FiberRoot | null {
  return workInProgressRoot;
}

export function getWorkInProgressRootRenderLanes(): Lanes {
  return workInProgressRootRenderLanes;
}

export function getCurrentTime(): number {
  return now();
}

export function requestUpdateLane(fiber: Fiber): Lane {
  return eventPriorityToLane(resolveUpdatePriority());
}

function markRootUpdated(root: FiberRoot, updatedLanes: Lanes) {
  _markRootUpdated(root, updatedLanes);
}

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane
) {
  // Mark that the root has a pending update.
  markRootUpdated(root, lane);

  if (
    (executionContext & RenderContext) !== NoLanes &&
    root === workInProgressRoot
  ) {
    // ... hc deleted
  } else {
    // This is a normal update, scheduled from outside the render phase. For
    // example, during an input event.
    if (root === workInProgressRoot) {
      // Received an update to a tree that's in the middle of rendering. Mark
      // that there was an interleaved update work on this root.
      if ((executionContext & RenderContext) === NoContext) {
        workInProgressRootInterleavedUpdatedLanes = mergeLanes(
          workInProgressRootInterleavedUpdatedLanes,
          lane
        );
      }
    }
    ensureRootIsScheduled(root);
  }
}

export function getExecutionContext(): ExecutionContext {
  return executionContext;
}
