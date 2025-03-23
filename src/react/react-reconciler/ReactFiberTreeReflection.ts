import { SuspenseInstance } from "../react-dom/ReactDOMHostConfig";
import { get as getInstance } from "../shared/ReactInstanceMap";
import { Container } from "./ReactFiberConfig";
import { Hydrating, NoFlags, Placement } from "./ReactFiberFlags";
import { SuspenseState } from "./ReactFiberSuspenseComponent";
import { Fiber } from "./ReactInternalTypes";
import { HostRoot, SuspenseComponent } from "./ReactWorkTags";

export function getNearestMountedFiber(fiber: Fiber): null | Fiber {
  let node = fiber;
  let nearestMounted = fiber;
  if (!fiber.alternate) {
    // If there is no alternate, this might be a new tree that isn't inserted
    // yet. If it is, then it will have a pending insertion effect on it.
    let nextNode = node;
    do {
      node = nextNode;
      if ((node.flags & (Placement | Hydrating)) !== NoFlags) {
        // This is an insertion or in-progress hydration. The nearest possible
        // mounted fiber is the parent but we need to continue to figure out
        // if that one is still mounted.
        nearestMounted = node.return;
      }
      nextNode = node.return;
    } while (nextNode);
  } else {
    while (node.return) {
      node = node.return;
    }
  }
  if (node.tag === HostRoot) {
    // TODO: Check if this was a nested HostRoot when used with
    // renderContainerIntoSubtree.
    return nearestMounted;
  }
  // If we didn't hit the root, that means that we're in an disconnected tree
  // that has been unmounted.
  return null;
}

export function getSuspenseInstanceFromFiber(
  fiber: Fiber
): null | SuspenseInstance {
  if (fiber.tag === SuspenseComponent) {
    let suspenseState: SuspenseState | null = fiber.memoizedState;
    if (suspenseState === null) {
      const current = fiber.alternate;
      if (current !== null) {
        suspenseState = current.memoizedState;
      }
    }
    if (suspenseState !== null) {
      return suspenseState.dehydrated;
    }
  }
  return null;
}

export function isMounted(component: any): boolean {
  const fiber: Fiber = getInstance(component);
  if (!fiber) {
    return false;
  }
  return getNearestMountedFiber(fiber) === fiber;
}

export function getContainerFromFiber(fiber: Fiber): null | Container {
  return fiber.tag === HostRoot
    ? (fiber.stateNode.containerInfo as Container)
    : null;
}
