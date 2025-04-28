import { ReactContext } from "../shared/ReactTypes";
import { ConcurrentUpdate } from "./ReactFiberConcurrentUpdates";
import { Container } from "./ReactFiberConfig";
import { Flags } from "./ReactFiberFlags";
import { Lane, LaneMap, Lanes } from "./ReactFiberLane";
import { RootTag } from "./ReactRootTags";
import { TypeOfMode } from "./ReactTypeOfMode";
import { WorkTag } from "./ReactWorkTags";

export type HookType =
  | 'useState'
  | 'useReducer'
  | 'useContext'
  | 'useRef'
  | 'useEffect'
  | 'useInsertionEffect'
  | 'useLayoutEffect'
  | 'useCallback'
  | 'useMemo'
  | 'useImperativeHandle'
  | 'useDebugValue'
  | 'useDeferredValue'
  | 'useTransition'
  | 'useMutableSource'
  | 'useSyncExternalStore'
  | 'useId'
  | 'useCacheRefresh';

export type ContextDependency<T> = {
  context: ReactContext<T>,
  next: ContextDependency<any> | null,
  memoizedValue: T,
  [key: string]: any,
};

export type Dependencies = {
  lanes: Lanes,
  firstContext: ContextDependency<any> | null,
  [key: string]: any,
};
// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {
  // These first fields are conceptually members of an Instance. This used to
  // be split into a separate type and intersected with the other Fiber fields,
  // but until Flow fixes its intersection bugs, we've merged them into a
  // single type.

  // An Instance is shared between all versions of a component. We can easily
  // break this out into a separate object to avoid copying so much to the
  // alternate versions of the tree. We put this on a single object for now to
  // minimize the number of objects created during the initial render.

  // Tag identifying the type of fiber.
  tag: WorkTag,

  // Unique identifier of this child.
  key: null | string,

  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  elementType: any,

  // The resolved function/class/ associated with this fiber.
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null,

  // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref: any,

  refCleanup: null | (() => void),

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: any,

  // The state used to create the output
  memoizedState: any,

  // Dependencies (contexts, events) for this fiber, if it has any
  // hc delete?
  dependencies: any,

  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the mode of its
  // parent. Additional flags can be set at creation time, but after that the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  // hc delete?
  mode: TypeOfMode,

  // Effect
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null,

  lanes: Lanes,
  childLanes: Lanes,

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null,

  // Time spent rendering this Fiber and its descendants for the current update.
  // This tells us how well the tree makes use of sCU for memoization.
  // It is reset to 0 each time we render and only updated when we don't bailout.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualDuration?: number,

  // If the Fiber is currently active in the "render" phase,
  // This marks the time at which the work began.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualStartTime?: number,

  // Duration of the most recent render time for this Fiber.
  // This value is not updated when we bailout for memoization purposes.
  // This field is only set when the enableProfilerTimer flag is enabled.
  selfBaseDuration?: number,

  // Sum of base times for all descendants of this Fiber.
  // This value bubbles up during the "complete" phase.
  // This field is only set when the enableProfilerTimer flag is enabled.
  treeBaseDuration?: number,
};

export type FiberRoot = {
  // The type of root (legacy, batched, concurrent, etc.)
  tag: RootTag,

  // Any additional information from the host associated with this root.
  containerInfo: Container,
  // Used only by persistent updates.
  pendingChildren: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,

  // hc delete?
  // pingCache: WeakMap<Wakeable, Set<any>> | Map<Wakeable, Set<any>> | null,

  // A finished work-in-progress HostRoot that's ready to be committed.
  finishedWork: Fiber | null,
  // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // it's superseded by a new one.
  timeoutHandle: number,
  // When a root has a pending commit scheduled, calling this function will
  // cancel it.
  // TODO: Can this be consolidated with timeoutHandle?
  cancelPendingCommit: null | (() => void),
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,

  // Used to create a linked list that represent all the roots that have
  // pending work scheduled on them.
  next: FiberRoot | null,

  // Node returned by Scheduler.scheduleCallback. Represents the next rendering
  // task that the root will work on.
  callbackNode: any,
  callbackPriority: Lane,

    // * 下面两个全局记录各优先级触发时间和过期时间，用于辅助调度
  // hc 记录各个优先级Lane上事件发生的时间
  eventTimes: LaneMap<number>,
  // hc 记录各个优先级Lane上任务的过期时间
  expirationTimes: LaneMap<number>,

  hiddenUpdates: LaneMap<Array<ConcurrentUpdate> | null>,

  pendingLanes: Lanes,
  suspendedLanes: Lanes,
  pingedLanes: Lanes,
  // warmLanes: Lanes,
  expiredLanes: Lanes,
  // errorRecoveryDisabledLanes: Lanes,
  // shellSuspendCounter: number,

  finishedLanes: Lanes,

  // entangledLanes: Lanes,
  // entanglements: LaneMap<Lanes>,
};


type BasicStateAction<S> = ((state: S) => S) | S;
type Dispatch<A> = (action: A) => void;

export type Dispatcher = {
  getCacheSignal?: () => AbortSignal,
  getCacheForType?: <T>(resourceType: () => T) => T,
  readContext<T>(context: ReactContext<T>): T,
  useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>],
  useReducer<S, I, A>(
    reducer: (arg0: S, arg1: A) => S,
    initialArg: I,
    init?: (arg0: I) => S,
  ): [S, Dispatch<A>],
  useContext<T>(context: ReactContext<T>): T,
  useRef<T>(initialValue: T): { current: T },
  useEffect(
    create: () => (() => void) | void,
    deps: Array<any> | void | null,
  ): void,
  useInsertionEffect(
    create: () => (() => void) | void,
    deps: Array<any> | void | null,
  ): void,
  useLayoutEffect(
    create: () => (() => void) | void,
    deps: Array<any> | void | null,
  ): void,
  useCallback<T>(callback: T, deps: Array<any> | void | null): T,
  useMemo<T>(nextCreate: () => T, deps: Array<any> | void | null): T,
  useImperativeHandle<T>(
    ref: {current: T | null} | ((inst: T | null) => any) | null | void,
    create: () => T,
    deps: Array<any> | void | null,
  ): void,
  useDeferredValue<T>(value: T): T,
  // useSyncExternalStore<T>(
  //   subscribe: (() => void) => (() => void),
  //   getSnapshot: () => T,
  //   getServerSnapshot?: () => T,
  // ): T,
  useId(): string,

};
