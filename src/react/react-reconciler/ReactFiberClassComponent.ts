import { createUpdate, enqueueUpdate, ForceUpdate, initializeUpdateQueue, ReplaceState } from "./ReactFiberClassUpdateQueue";
import { isMounted } from "./ReactFiberTreeReflection";
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { get as getInstance, set as setInstance } from '../shared/ReactInstanceMap';
import { Fiber } from "./ReactInternalTypes";
import { Lanes } from "./ReactFiberLane";
import { Flags, Update } from "./ReactFiberFlags";

const classComponentUpdater = {
  isMounted,
  enqueueSetState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(fiber);

    const update = createUpdate(eventTime, lane);
    update.payload = payload;
    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    const root = enqueueUpdate(fiber, update, lane);
    if (root !== null) {
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
    }
  },
  enqueueReplaceState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(fiber);

    const update = createUpdate(eventTime, lane);
    update.tag = ReplaceState;
    update.payload = payload;

    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    const root = enqueueUpdate(fiber, update, lane);
    if (root !== null) {
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
    }
  },
  enqueueForceUpdate(inst, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(fiber);

    const update = createUpdate(eventTime, lane);
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    const root = enqueueUpdate(fiber, update, lane);
    if (root !== null) {
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
    }
  },
};

// Invokes the mount life-cycles on a previously never rendered instance.
export function mountClassInstance(
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): void {

  const instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = {};

  initializeUpdateQueue(workInProgress);

  instance.state = workInProgress.memoizedState;
  
  // hc class组件的一个生命周期函数
  // const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  // if (typeof getDerivedStateFromProps === 'function') {
  //   applyDerivedStateFromProps(
  //     workInProgress,
  //     ctor,
  //     getDerivedStateFromProps,
  //     newProps,
  //   );
  //   instance.state = workInProgress.memoizedState;
  // }

  if (typeof instance.componentDidMount === 'function') {
    let fiberFlags: Flags = Update;
    workInProgress.flags |= fiberFlags;
  }
}

function adoptClassInstance(workInProgress: Fiber, instance: any): void {
  instance.updater = classComponentUpdater;
  workInProgress.stateNode = instance;
  // The instance needs access to the fiber so that it can schedule updates
  setInstance(instance, workInProgress);
}

export function constructClassInstance(
  workInProgress: Fiber,
  ctor: any,
  props: any,
): any {

  let instance = new ctor(props, {});
 
  const state = (workInProgress.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  adoptClassInstance(workInProgress, instance);

  return instance;
}