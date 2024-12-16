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

export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;
}

export function includesNonIdleWork(lanes: Lanes): boolean {
  return (lanes & NonIdleLanes) !== NoLanes;
}

export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

export function markRootUpdated(root: FiberRoot, updateLane: Lane) {
  root.pendingLanes |= updateLane;
}

export const NoTimestamp = -1;

function pickArbitraryLaneIndex(lanes: Lanes) {
  return 31 - Math.clz32(lanes);
}

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