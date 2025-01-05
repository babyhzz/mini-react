import { Container } from "../react-reconciler/ReactFiberConfig";
import { Fiber } from "../react-reconciler/ReactInternalTypes";

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;
const internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
const internalEventHandlesSetKey = '__reactHandles$' + randomKey;
const internalRootNodeResourcesKey = '__reactResources$' + randomKey;
const internalHoistableMarker = '__reactMarker$' + randomKey;


export function markContainerAsRoot(hostRoot: Fiber, node: Container): void {
  // @ts-ignore
  node[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: Container): void {
  // @ts-ignore
  node[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: Container): boolean {
  // @ts-ignore
  return !!node[internalContainerInstanceKey];
}
