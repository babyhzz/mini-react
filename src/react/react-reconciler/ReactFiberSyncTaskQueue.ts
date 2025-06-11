import { scheduleCallback } from "../scheduler/Scheduler";
import { ImmediatePriority } from "../scheduler/SchedulerPriorities";
import { DiscreteEventPriority, getCurrentUpdatePriority, setCurrentUpdatePriority } from "./ReactEventPriorities";

let syncQueue: Array<any> | null = null;
let isFlushingSyncQueue: boolean = false;

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrance.
    isFlushingSyncQueue = true;
    let i = 0;
    const previousUpdatePriority = getCurrentUpdatePriority();
    try {
      const isSync = true;
      const queue = syncQueue;
      // TODO: Is this necessary anymore? The only user code that runs in this
      // queue is in the render or commit phases.
      setCurrentUpdatePriority(DiscreteEventPriority);
      for (; i < queue.length; i++) {
        let callback = queue[i];
        do {
          callback = callback(isSync);
        } while (callback !== null);
      }
      syncQueue = null;
    } catch (error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      // Resume flushing in the next tick
      scheduleCallback(ImmediatePriority, flushSyncCallbacks);
      throw error;
    } finally {
      setCurrentUpdatePriority(previousUpdatePriority);
      isFlushingSyncQueue = false;
    }
  }
  return null;
}