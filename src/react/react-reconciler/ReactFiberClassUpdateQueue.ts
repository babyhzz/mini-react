import type { Lane, Lanes } from "./ReactFiberLane";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";

import { NoLane, NoLanes } from "./ReactFiberLane";

import { Callback } from "./ReactFiberFlags";

import { enqueueConcurrentClassUpdate } from "./ReactFiberConcurrentUpdates";

export type Update = {
  // TODO: Temporary field. Will remove this by storing a map of
  // transition -> event time on the root.
  eventTime: number;
  lane: Lane;

  tag: 0 | 1 | 2 | 3;
  payload: any;
  callback: (() => any) | null;

  next: Update | null;
};

export type SharedQueue = {
  pending: Update | null;
  lanes: Lanes;
};

export type UpdateQueue = {
  baseState: any;
  firstBaseUpdate: Update | null;
  lastBaseUpdate: Update | null;
  shared: SharedQueue;
  effects: Array<Update> | null;
};

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

// Global state that is reset at the beginning of calling `processUpdateQueue`.
// It should only be read right after calling `processUpdateQueue`, via
// `checkHasForceUpdateAfterProcessing`.
let hasForceUpdate = false;

export function initializeUpdateQueue(fiber: Fiber): void {
  const queue: UpdateQueue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
      lanes: NoLanes,
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}

export function cloneUpdateQueue(current: Fiber, workInProgress: Fiber): void {
  // Clone the update queue from current. Unless it's already a clone.
  const queue: UpdateQueue = workInProgress.updateQueue;
  const currentQueue: UpdateQueue = current.updateQueue;
  if (queue === currentQueue) {
    const clone: UpdateQueue = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared,
      effects: currentQueue.effects,
    };
    workInProgress.updateQueue = clone;
  }
}

export function createUpdate(eventTime: number, lane: Lane): Update {
  const update: Update = {
    eventTime,
    lane,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
}

export function enqueueUpdate(
  fiber: Fiber,
  update: Update,
  lane: Lane
): FiberRoot | null {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return null;
  }

  const sharedQueue: SharedQueue = updateQueue.shared;
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

function getStateFromUpdate(
  workInProgress: Fiber,
  queue: UpdateQueue,
  update: Update,
  prevState: any,
  nextProps: any,
  instance: any
): any {
  switch (update.tag) {
    case ReplaceState: {
      const payload = update.payload;
      if (typeof payload === "function") {
        return payload.call(instance, prevState, nextProps);
      }
      return payload;
    }
    // Intentional fallthrough
    case UpdateState: {
      const payload = update.payload;
      let partialState;
      if (typeof payload === "function") {
        // Updater function
        partialState = payload.call(instance, prevState, nextProps);
      } else {
        // Partial state object
        partialState = payload;
      }
      if (partialState === null || partialState === undefined) {
        // Null and undefined are treated as no-ops.
        return prevState;
      }
      // Merge the partial state and the previous state.
      return Object.assign({}, prevState, partialState);
    }
    case ForceUpdate: {
      hasForceUpdate = true;
      return prevState;
    }
  }
  return prevState;
}

let didReadFromEntangledAsyncAction: boolean = false;


export function processUpdateQueue(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes
): void {
  didReadFromEntangledAsyncAction = false;

  // This is always non-null on a ClassComponent or HostRoot
  const queue: UpdateQueue = workInProgress.updateQueue;

  hasForceUpdate = false;

  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;

  // Check if there are pending updates. If so, transfer them to the base queue.
  let pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    queue.shared.pending = null;

    // The pending queue is circular. Disconnect the pointer between first
    // and last so that it's non-circular.
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    // Append pending updates to base queue
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    // If there's a current queue, and it's different from the base queue, then
    // we need to transfer the updates to that queue, too. Because the base
    // queue is a singly-linked list with no cycles, we can append to both
    // lists and take advantage of structural sharing.
    // TODO: Pass `current` as argument
    const current = workInProgress.alternate;
    if (current !== null) {
      // This is always non-null on a ClassComponent or HostRoot
      const currentQueue: UpdateQueue = current.updateQueue;
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate;
      }
    }
  }

  // These values may change as we process the queue.
  if (firstBaseUpdate !== null) {
    // Iterate through the list of updates to compute the result.
    let newState = queue.baseState;
    // TODO: Don't need to accumulate this. Instead, we can remove renderLanes
    // from the original lanes.
    let newLanes: Lanes = NoLanes;

    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate: null | Update = null;

    let update: Update = firstBaseUpdate;
    do {
      // Process this update.
      newState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        newState,
        props,
        instance
      );
      const callback = update.callback;
      if (
        callback !== null &&
        // If the update was already committed, we should not queue its
        // callback again.
        update.lane !== NoLane
      ) {
        workInProgress.flags |= Callback;
        const effects = queue.effects;
        if (effects === null) {
          queue.effects = [update];
        } else {
          effects.push(update);
        }
      }
      // $FlowFixMe[incompatible-type] we bail out when we get a null
      update = update.next;
      if (update === null) {
        pendingQueue = queue.shared.pending;
        if (pendingQueue === null) {
          break;
        } else {
          // An update was scheduled from inside a reducer. Add the new
          // pending updates to the end of the list and keep processing.
          const lastPendingUpdate = pendingQueue;
          // Intentionally unsound. Pending updates form a circular list, but we
          // unravel them when transferring them to the base queue.
          const firstPendingUpdate = lastPendingUpdate.next;
          lastPendingUpdate.next = null;
          update = firstPendingUpdate;
          queue.lastBaseUpdate = lastPendingUpdate;
          queue.shared.pending = null;
        }
      }
    } while (true);

    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }

    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;

    if (firstBaseUpdate === null) {
      // `queue.lanes` is used for entangling transitions. We can set it back to
      // zero once the queue is empty.
      queue.shared.lanes = NoLanes;
    }
    
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}

export function resetHasForceUpdateBeforeProcessing() {
  hasForceUpdate = false;
}

export function checkHasForceUpdateAfterProcessing(): boolean {
  return hasForceUpdate;
}
