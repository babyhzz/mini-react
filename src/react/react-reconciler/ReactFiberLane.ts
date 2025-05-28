import { FiberRoot } from "./ReactInternalTypes";

export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;

export const TotalLanes = 31;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncHydrationLane: Lane = /*               */ 0b0000000000000000000000000000001;
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000010;
export const SyncLaneIndex: number = 1;

export const InputContinuousHydrationLane: Lane = /*    */ 0b0000000000000000000000000000100;
export const InputContinuousLane: Lane = /*             */ 0b0000000000000000000000000001000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000000010000;
export const DefaultLane: Lane = /*                     */ 0b0000000000000000000000000100000;

export const SyncUpdateLanes: Lane =
SyncLane | InputContinuousLane | DefaultLane;

export const IdleLane: Lane = /*                        */ 0b0010000000000000000000000000000;

const NonIdleLanes: Lanes = /*                          */ 0b0000111111111111111111111111111;

export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
  return (a & b) !== NoLanes;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
  // 这里取最低位的1，-为按位取反后+1
  return lanes & -lanes;
}

function getHighestPriorityLanes(lanes: Lanes | Lane): Lanes {
  switch (getHighestPriorityLane(lanes)) {
    case SyncLane:
      return SyncLane;
    case InputContinuousHydrationLane:
      return InputContinuousHydrationLane;
    case InputContinuousLane:
      return InputContinuousLane;
    case DefaultHydrationLane:
      return DefaultHydrationLane;
    case DefaultLane:
      return DefaultLane;
    default:
      // This shouldn't be reachable, but as a fallback, return the entire bitmask.
      return lanes;
  }
}

export function includesBlockingLane(root: FiberRoot, lanes: Lanes) {
  const SyncDefaultLanes =
    InputContinuousHydrationLane |
    InputContinuousLane |
    DefaultHydrationLane |
    DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLanes;
}
export function includesExpiredLane(root: FiberRoot, lanes: Lanes) {
  // This is a separate check from includesBlockingLane because a lane can
  // expire after a render has already started.
  return (lanes & root.expiredLanes) !== NoLanes;
}


export function includesNonIdleWork(lanes: Lanes): boolean {
  return (lanes & NonIdleLanes) !== NoLanes;
}

export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

function pickArbitraryLaneIndex(lanes: Lanes) {
  return 31 - Math.clz32(lanes);
}

function laneToIndex(lane: Lane) {
  return pickArbitraryLaneIndex(lane);
}

export function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes {
  // Early bailout if there's no pending work left.
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }

  let nextLanes = NoLanes;

  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;

  // Do not work on any idle work until all the non-idle work has finished,
  // even if the work is suspended.
  const nonIdlePendingLanes = pendingLanes & NonIdleLanes;
  if (nonIdlePendingLanes !== NoLanes) {
    const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    if (nonIdleUnblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
    } else {
      const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
      if (nonIdlePingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
      }
    }
  } else {
    // The only remaining work is Idle.
    const unblockedLanes = pendingLanes & ~suspendedLanes;
    if (unblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(unblockedLanes);
    } else {
      if (pingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(pingedLanes);
      }
    }
  }

  return nextLanes;
}

export function markRootFinished(root: FiberRoot, remainingLanes: Lanes) {
  const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;

  root.pendingLanes = remainingLanes;

  // Let's try everything again
  root.suspendedLanes = NoLanes;
  root.pingedLanes = NoLanes;

  root.expiredLanes &= remainingLanes;
  // root.mutableReadLanes &= remainingLanes;

  // root.entangledLanes &= remainingLanes;

  // const entanglements = root.entanglements;
  const eventTimes = root.eventTimes;
  const expirationTimes = root.expirationTimes;

  // Clear the lanes that no longer have pending work
  let lanes = noLongerPendingLanes;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;

    // entanglements[index] = NoLanes;
    eventTimes[index] = NoTimestamp;
    expirationTimes[index] = NoTimestamp;

    lanes &= ~lane;
  }
}

export function markRootUpdated(root: FiberRoot, updateLane: Lane, eventTime: number) {
  root.pendingLanes |= updateLane;

  if (updateLane !== IdleLane) {
    root.suspendedLanes = NoLanes;
    root.pingedLanes = NoLanes;
  }

  const eventTimes = root.eventTimes;
  const index = laneToIndex(updateLane);
  // We can always overwrite an existing timestamp because we prefer the most
  // recent event, and we assume time is monotonically increasing.
  eventTimes[index] = eventTime;
}

export const NoTimestamp = -1;



export function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number,
): void {
  // TODO: This gets called every time we yield. We can optimize by storing
  // the earliest expiration time on the root. Then use that to quickly bail out
  // of this function.

  // const pendingLanes = root.pendingLanes;
  // const expirationTimes = root.expirationTimes;

  // Iterate through the pending lanes and check if we've reached their
  // expiration time. If so, we'll assume the update is being starved and mark
  // it as expired to force it to finish.
  // TODO: We should be able to replace this with upgradePendingLanesToSync
  //
  // We exclude retry lanes because those must always be time sliced, in order
  // to unwrap uncached promises.
  // TODO: Write a test for this
  // hc todo deleted 这个的作用是什么？
  // let lanes = pendingLanes;
  // while (lanes > 0) {
  //   const index = pickArbitraryLaneIndex(lanes);
  //   const lane = 1 << index;

  //   const expirationTime = expirationTimes[index];
  //   if (expirationTime === NoTimestamp) {
  //     // Found a pending lane with no expiration time. If it's not suspended, or
  //     // if it's pinged, assume it's CPU-bound. Compute a new expiration time
  //     // using the current time.
  //     if (
  //       (lane & suspendedLanes) === NoLanes ||
  //       (lane & pingedLanes) !== NoLanes
  //     ) {
  //       // Assumes timestamps are monotonically increasing.
  //       expirationTimes[index] = computeExpirationTime(lane, currentTime);
  //     }
  //   } else if (expirationTime <= currentTime) {
  //     // This lane expired
  //     root.expiredLanes |= lane;
  //   }

  //   lanes &= ~lane;
  // }
}

export function createLaneMap<T>(initial: T): LaneMap<T> {
  // Intentionally pushing one by one.
  // https://v8.dev/blog/elements-kinds#avoid-creating-holes
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}

export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}
