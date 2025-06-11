import type { FiberRoot } from "../react-reconciler/ReactInternalTypes";
import type { ReactNodeList } from "../shared/ReactTypes";

import {
  markContainerAsRoot,
  unmarkContainerAsRoot
} from "./ReactDOMComponentTree";

import {
  createContainer,
  updateContainer
} from "../react-reconciler/ReactFiberReconciler";
import { ConcurrentRoot } from "../react-reconciler/ReactRootTags";
import { COMMENT_NODE } from "./HTMLNodeType";
import { listenToAllSupportedEvents } from "./events/DOMPluginEventSystem";

export type RootType = {
  render(children: ReactNodeList): void;
  unmount(): void;
  _internalRoot: FiberRoot | null;
};

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

export function createRoot(
  container: Element | Document | DocumentFragment
): RootType {
  // hc 创建Fiber容器FiberRoot，这里顺便创建了HostRootFiber
  const root: FiberRoot = createContainer(container, ConcurrentRoot);
  markContainerAsRoot(root.current, container);

  const rootContainerElement: Document | Element | DocumentFragment =
  container.nodeType === COMMENT_NODE
    ? container.parentNode as any
    : container;

  listenToAllSupportedEvents(rootContainerElement);

  return new ReactDOMRoot(root);
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList): void {
  const root = this._internalRoot;
  if (root === null) {
    throw new Error("Cannot update an unmounted root.");
  }

  updateContainer(children, root);
};

ReactDOMRoot.prototype.unmount = function(): void {
  const root = this._internalRoot;
  if (root !== null) {
    this._internalRoot = null;
    const container = root.containerInfo;
    // hc flushSync 函数未知
    // flushSync(() => {
    //   updateContainer(null, root);
    // });
    unmarkContainerAsRoot(container);
  }
};
