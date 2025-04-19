import { shouldSetTextContent } from "../react-dom/ReactDOMHostConfig";
import ReactSharedInternals from "../react/ReactSharedInternals";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import {
  constructClassInstance,
  mountClassInstance,
} from "./ReactFiberClassComponent";
import {
  cloneUpdateQueue,
  processUpdateQueue,
} from "./ReactFiberClassUpdateQueue";
import { ContentReset, PerformedWork, Ref } from "./ReactFiberFlags";
import { pushHostContainer } from "./ReactFiberHostContext";
import { Lanes, NoLanes } from "./ReactFiberLane";
import { resolveDefaultProps } from "./ReactFiberLazyComponent";
import { RootState } from "./ReactFiberRoot";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  ForwardRef,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostPortal,
  HostRoot,
  HostText,
  LazyComponent,
  MemoComponent,
  Mode,
  Profiler,
  SimpleMemoComponent,
  SuspenseComponent,
} from "./ReactWorkTags";

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

let didReceiveUpdate: boolean = false;

let didWarnAboutBadClass;
let didWarnAboutModulePatternComponent;
let didWarnAboutContextTypeOnFunctionComponent;
let didWarnAboutGetDerivedStateOnFunctionComponent;
let didWarnAboutFunctionRefs;
export let didWarnAboutReassigningProps;
let didWarnAboutRevealOrder;
let didWarnAboutTailOptions;
let didWarnAboutDefaultPropsOnFunctionComponent;

export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes
) {
  if (current === null) {
    // hc: 组件初次挂载
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
  }
}

function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes
) {
  // Refs should update even if shouldComponentUpdate returns false
  markRef(current, workInProgress);

  const instance = workInProgress.stateNode;
  // Rerender
  ReactCurrentOwner.current = workInProgress;
  let nextChildren = instance.render();

  reconcileChildren(current, workInProgress, nextChildren, renderLanes);

  // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.
  workInProgress.memoizedState = instance.state;

  return workInProgress.child;
}

function pushHostRootContext(workInProgress) {
  const root = workInProgress.stateNode;
  pushHostContainer(workInProgress, root.containerInfo);
}

function updateHostRoot(current, workInProgress, renderLanes) {
  pushHostRootContext(workInProgress);

  const nextProps = workInProgress.pendingProps;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);

  const nextState: RootState = workInProgress.memoizedState;
  // Caution: React DevTools currently depends on this property
  // being called "element".
  const nextChildren = nextState.element;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps: any,
  renderLanes
) {
  let context;
  let nextChildren;
  let hasId;

  // hc: 暂不学习
  // prepareToReadContext(workInProgress, renderLanes);

  // nextChildren = renderWithHooks(
  //   current,
  //   workInProgress,
  //   Component,
  //   nextProps,
  //   context,
  //   renderLanes
  // );
  // hasId = checkDidRenderIdHook();

  // if (current !== null && !didReceiveUpdate) {
  //   bailoutHooks(current, workInProgress, renderLanes);
  //   return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  // }

  // // React DevTools reads this flag.
  // workInProgress.flags |= PerformedWork;
  // reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  // return workInProgress.child;
}

function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes
) {
  const instance = workInProgress.stateNode;
  let shouldUpdate;
  let hasContext;
  if (instance === null) {
    // In the initial pass we might need to construct the instance.
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    shouldUpdate = true;
  } else if (current === null) {
    // hc 不知道这个的调用时机
    // In a resume, we'll already have an instance we can reuse.
    // shouldUpdate = resumeMountClassInstance(
    //   workInProgress,
    //   Component,
    //   nextProps,
    //   renderLanes,
    // );
  } else {
    // hc 不知道这个的调用时机
    // shouldUpdate = updateClassInstance(
    //   current,
    //   workInProgress,
    //   Component,
    //   nextProps,
    //   renderLanes,
    // );
  }
  const nextUnitOfWork = finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderLanes
  );
  return nextUnitOfWork;
}

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  // hc: 只有一个文本节点
  if (isDirectTextChild) {
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }

  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateHostText(current, workInProgress) {
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case LazyComponent: {
      // hc: 删除，以后研究
      return null;
    }
    case FunctionComponent: {
      // hc: 函数组件重点研究
      // const Component = workInProgress.type;
      // const unresolvedProps = workInProgress.pendingProps;
      // const resolvedProps =
      //   workInProgress.elementType === Component
      //     ? unresolvedProps
      //     : resolveDefaultProps(Component, unresolvedProps);
      // return updateFunctionComponent(
      //   current,
      //   workInProgress,
      //   Component,
      //   resolvedProps,
      //   renderLanes
      // );
      return null;
    }
    case ClassComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes
      );
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      return updateHostText(current, workInProgress);
    // case SuspenseComponent:
    //   return updateSuspenseComponent(current, workInProgress, renderLanes);
    // case HostPortal:
    //   return updatePortalComponent(current, workInProgress, renderLanes);
    // case ForwardRef: {
    //   const type = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   const resolvedProps =
    //     workInProgress.elementType === type
    //       ? unresolvedProps
    //       : resolveDefaultProps(type, unresolvedProps);
    //   return updateForwardRef(
    //     current,
    //     workInProgress,
    //     type,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    // case Fragment:
    //   return updateFragment(current, workInProgress, renderLanes);
    // case Mode:
    // case ContextProvider:
    //   return updateContextProvider(current, workInProgress, renderLanes);
    // case ContextConsumer:
    //   return updateContextConsumer(current, workInProgress, renderLanes);
    // case MemoComponent: {
    //   const type = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   // Resolve outer props first, then resolve inner props.
    //   let resolvedProps = resolveDefaultProps(type, unresolvedProps);
    //   resolvedProps = resolveDefaultProps(type.type, resolvedProps);
    //   return updateMemoComponent(
    //     current,
    //     workInProgress,
    //     type,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    // case SimpleMemoComponent: {
    //   return updateSimpleMemoComponent(
    //     current,
    //     workInProgress,
    //     workInProgress.type,
    //     workInProgress.pendingProps,
    //     renderLanes,
    //   );
    // }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue."
  );
}

export function markWorkInProgressReceivedUpdate() {
  didReceiveUpdate = true;
}

export { beginWork };
