import { FiberRoot } from "./ReactInternalTypes";

type ReactRootContainer = {
  _reactRootContainer?: FiberRoot;
  // 这里其实也挂载了一个属性放置 HostRoot
  // node[internalContainerInstanceKey] = hostRoot;
};

export type Container =
  | (Element & ReactRootContainer)
  | (Document & ReactRootContainer)
  | (DocumentFragment & ReactRootContainer);

// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout: any =
  typeof setTimeout === "function" ? setTimeout : undefined;
export const cancelTimeout: any =
  typeof clearTimeout === "function" ? clearTimeout : undefined;
export const noTimeout = -1;
const localPromise = typeof Promise === "function" ? Promise : undefined;
const localRequestAnimationFrame =
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame
    : scheduleTimeout;
// -------------------
//     Microtasks
// -------------------
export const supportsMicrotasks = true;
export const scheduleMicrotask: any =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : typeof localPromise !== "undefined"
    ? (callback: () => any) => localPromise.resolve(null).then(callback)
    : scheduleTimeout; // TODO: Determine the best fallback here.
