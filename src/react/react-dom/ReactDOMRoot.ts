/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ReactNodeList } from "../shared/ReactTypes";
import type { FiberRoot } from "../react-reconciler/ReactInternalTypes";

import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { enableAsyncActions } from "shared/ReactFeatureFlags";
import {
  isContainerMarkedAsRoot,
  markContainerAsRoot,
  unmarkContainerAsRoot,
} from "../react-dom-binding/ReactDOMComponentTree";
import { listenToAllSupportedEvents } from "react-dom-bindings/src/events/DOMPluginEventSystem";
import { COMMENT_NODE } from "react-dom-bindings/src/client/HTMLNodeType";

import {
  createContainer,
  createHydrationContainer,
  updateContainer,
  updateContainerSync,
  flushSyncWork,
  isAlreadyRendering,
  defaultOnUncaughtError,
  defaultOnCaughtError,
  defaultOnRecoverableError,
} from "../react-reconciler/ReactFiberReconciler";
import { ConcurrentRoot } from "../react-reconciler/ReactRootTags";
import { isValidContainer } from "../react-dom-binding/ReactDOMContainer";

export type RootType = {
  render(children: ReactNodeList): void;
  unmount(): void;
  _internalRoot: FiberRoot | null;
};

function ReactDOMRoot(internalRoot: FiberRoot) {
  // @ts-ignore
  this._internalRoot = internalRoot;
}

export function createRoot(
  container: Element | Document | DocumentFragment
): RootType {
  if (!isValidContainer(container)) {
    throw new Error("Target container is not a DOM element.");
  }

  // hc 这里叫createFiberRoot更合适？这里也同步创建了HostRootFiber
  const root: FiberRoot = createContainer(container, ConcurrentRoot);
  markContainerAsRoot(root.current, container);

  // hc TODO 事件相关，暂先不处理
  // listenToAllSupportedEvents(container);

  // @ts-ignore
  return new ReactDOMRoot(root);
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList): void {
  const root = this._internalRoot;
  if (root === null) {
    throw new Error("Cannot update an unmounted root.");
  }

  updateContainer(children, root, null, null);
};

// hc TODO 暂时先不管
// ReactDOMRoot.prototype.unmount =
//   // $FlowFixMe[missing-this-annot]
//   function (): void {
//     const root = this._internalRoot;
//     if (root !== null) {
//       this._internalRoot = null;
//       const container = root.containerInfo;
//       updateContainerSync(null, root, null, null);
//       flushSyncWork();
//       unmarkContainerAsRoot(container);
//     }
//   };
