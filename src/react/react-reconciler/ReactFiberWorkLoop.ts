import { getCurrentEventPriority } from "../react-dom/ReactDOMHostConfig";
import { now } from "../scheduler/Scheduler";
import { getCurrentUpdatePriority } from "./ReactEventPriorities";
import { Lane, NoLane, NoTimestamp } from "./ReactFiberLane";
import { Fiber, FiberRoot } from "./ReactInternalTypes";

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


// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime: number = Infinity;
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.

let currentEventTime: number = NoTimestamp;

export function getWorkInProgressRoot(): FiberRoot | null {
  return workInProgressRoot;
}

export function requestEventTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // We're inside React, so it's fine to read the actual time.
    return now();
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoTimestamp) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = now();
  return currentEventTime;
}

export function getCurrentTime(): number {
  return now();
}

export function requestUpdateLane(fiber: Fiber): Lane {
    // Updates originating inside certain React methods, like flushSync, have
  // their priority set by tracking it with a context variable.
  //
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  // hc 内部更新
  const updateLane: Lane = getCurrentUpdatePriority();
  if (updateLane !== NoLane) {
    return updateLane;
  }

  // This update originated outside React. Ask the host environment for an
  // appropriate priority, based on the type of event.
  //
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  // hc 外部方法更新
  const eventLane: Lane = getCurrentEventPriority();
  return eventLane;
}

// function markRootUpdated(root: FiberRoot, updatedLanes: Lanes) {
//   _markRootUpdated(root, updatedLanes);
// }

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
