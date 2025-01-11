import { appendInitialChild, createInstance, Instance } from "../react-dom/ReactDOMHostConfig";
import { ForceClientRender, NoFlags, Snapshot, StaticMask } from "./ReactFiberFlags";
import { getRootHostContainer, popHostContainer } from "./ReactFiberHostContext";
import { Lanes, mergeLanes, NoLanes } from "./ReactFiberLane";
import { RootState } from "./ReactFiberRoot";
import { Fiber } from "./ReactInternalTypes";
import {
  ClassComponent,
  ContextConsumer,
  ForwardRef,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostPortal,
  HostRoot,
  HostText,
  LazyComponent,
  MemoComponent,
  SimpleMemoComponent,
} from "./ReactWorkTags";

function appendAllChildren(
  parent: Instance,
  workInProgress: Fiber,
  needsVisibilityToggle: boolean,
  isHidden: boolean
) {
  // We only have the top Fiber that was created but we need recurse down its
  // children to find all the terminal nodes.
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.tag === HostPortal) {
      // If we have a portal child, then we don't want to traverse
      // down its children. Instead, we'll get insertions from each child in
      // the portal directly.
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
function bubbleProperties(completedWork: Fiber) {
  const didBailout =
    completedWork.alternate !== null &&
    completedWork.alternate.child === completedWork.child;

  let newChildLanes = NoLanes;
  let subtreeFlags = NoFlags;

  if (!didBailout) {
    // Bubble up the earliest expiration time.
    
      let child = completedWork.child;
      while (child !== null) {
        newChildLanes = mergeLanes(
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes),
        );

        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        // Update the return pointer so the tree is consistent. This is a code
        // smell because it assumes the commit phase is never concurrent with
        // the render phase. Will address during refactor to alternate model.
        child.return = completedWork;

        child = child.sibling;
      }

    completedWork.subtreeFlags |= subtreeFlags;
  } else {

      let child = completedWork.child;
      while (child !== null) {
        newChildLanes = mergeLanes(
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes),
        );

        // "Static" flags share the lifetime of the fiber/hook they belong to,
        // so we should bubble those up even during a bailout. All the other
        // flags have a lifetime only of a single render + commit, so we should
        // ignore them.
        subtreeFlags |= child.subtreeFlags & StaticMask;
        subtreeFlags |= child.flags & StaticMask;

        // Update the return pointer so the tree is consistent. This is a code
        // smell because it assumes the commit phase is never concurrent with
        // the render phase. Will address during refactor to alternate model.
        child.return = completedWork;

        child = child.sibling;
      }

    completedWork.subtreeFlags |= subtreeFlags;
  }

  completedWork.childLanes = newChildLanes;

  return didBailout;
}


export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case ContextConsumer:
    case MemoComponent:
    case ClassComponent: {
      bubbleProperties(workInProgress);
      return null;
    }
    case HostRoot: {
      const fiberRoot = workInProgress.stateNode;
      popHostContainer(workInProgress);
      if (fiberRoot.pendingContext) {
        fiberRoot.context = fiberRoot.pendingContext;
        fiberRoot.pendingContext = null;
      }
     
      if (current !== null) {
        const prevState: RootState = current.memoizedState;
        if (
          // Check if this is a client root
          !prevState.isDehydrated ||
          // Check if we reverted to client rendering (e.g. due to an error)
          (workInProgress.flags & ForceClientRender) !== NoFlags
        ) {
          // Schedule an effect to clear this container at the start of the
          // next commit. This handles the case of React rendering into a
          // container with previous children. It's also safe to do for
          // updates too, because current.child would only be null if the
          // previous render was null (so the container would already
          // be empty).
          workInProgress.flags |= Snapshot;
        }
      }
      // updateHostContainer(current, workInProgress);
      bubbleProperties(workInProgress);
      return null;
    }
    case HostComponent: {
      const rootContainerInstance = getRootHostContainer();
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        // updateHostComponent(
        //   current,
        //   workInProgress,
        //   type,
        //   newProps,
        //   rootContainerInstance,
        // );
        // if (current.ref !== workInProgress.ref) {
        //   markRef(workInProgress);
        // }
      } else {
        const instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          {},
          workInProgress
        );

        appendAllChildren(instance, workInProgress, false, false);

        workInProgress.stateNode = instance;

        // Certain renderers require commit-time effects for initial mount.
        // (eg DOM renderer supports auto-focus for certain elements).
        // Make sure such renderers get scheduled for later work.
        // hc 下面两个的含义是啥？
        // if (
        //   finalizeInitialChildren(
        //     instance,
        //     type,
        //     newProps,
        //     rootContainerInstance,
        //     currentHostContext
        //   )
        // ) {
        //   markUpdate(workInProgress);
        // }

        // if (workInProgress.ref !== null) {
        //   // If there is a ref on a host node we need to schedule a callback
        //   markRef(workInProgress);
        // }
      }
      bubbleProperties(workInProgress);
      return null;
    }
    case HostText: {
      // const newText = newProps;
      // if (current && workInProgress.stateNode != null) {
      //   const oldText = current.memoizedProps;
      //   // If we have an alternate, that means this is an update and we need
      //   // to schedule a side-effect to do the updates.
      //   updateHostText(current, workInProgress, oldText, newText);
      // } else {
      //   if (typeof newText !== "string") {
      //     if (workInProgress.stateNode === null) {
      //       throw new Error(
      //         "We must have new props for new mounts. This error is likely " +
      //           "caused by a bug in React. Please file an issue."
      //       );
      //     }
      //     // This can happen when we abort work.
      //   }
      //   const rootContainerInstance = getRootHostContainer();
      //   const currentHostContext = getHostContext();
      //   const wasHydrated = popHydrationState(workInProgress);
      //   if (wasHydrated) {
      //     if (prepareToHydrateHostTextInstance(workInProgress)) {
      //       markUpdate(workInProgress);
      //     }
      //   } else {
      //     workInProgress.stateNode = createTextInstance(
      //       newText,
      //       rootContainerInstance,
      //       currentHostContext,
      //       workInProgress
      //     );
      //   }
      // }
      // bubbleProperties(workInProgress);
      return null;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue."
  );
}
