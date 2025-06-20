import {
  DefaultEventPriority,
  EventPriority,
} from "../react-reconciler/ReactEventPriorities";
import { Container } from "../react-reconciler/ReactFiberConfig";
import { Fiber } from "../react-reconciler/ReactInternalTypes";
import { getChildNamespace } from "./DOMNamespaces";
import { DOMEventName } from "./events/DOMEventNames";
import { COMMENT_NODE } from "./HTMLNodeType";
import {
  createElement,
  createTextNode,
  setInitialProperties,
  updateProperties,
} from "./ReactDOMComponent";
import { precacheFiberNode, updateFiberProps } from "./ReactDOMComponentTree";
import { getEventPriority } from "./ReactDOMEventListener";
import setTextContent from "./setTextContent";

export type Type = string;
export type Props = {
  autoFocus?: boolean;
  children?: any;
  disabled?: boolean;
  hidden?: boolean;
  suppressHydrationWarning?: boolean;
  dangerouslySetInnerHTML?: any;
  style?: Record<string, any>;
  bottom?: null | number;
  left?: null | number;
  right?: null | number;
  top?: null | number;
  [key: string]: any;
};

export type Instance = Element;
export type TextInstance = Text;
export type PublicInstance = Element | Text;
export type SuspenseInstance = Comment & {
  _reactRetry?: () => void;
  [key: string]: any;
};

type HostContextProd = string;
export type HostContext = HostContextProd;

// hc 是否有直接操作DOM能力，浏览器支持
export const supportsMutation = true;

const SUSPENSE_START_DATA = "$";
const SUSPENSE_END_DATA = "/$";
const SUSPENSE_PENDING_START_DATA = "$?";
const SUSPENSE_FALLBACK_START_DATA = "$!";

export function getCurrentEventPriority(): EventPriority {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type as DOMEventName);
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    typeof props.children === "string" ||
    typeof props.children === "number" ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance
): void {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
}

export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance
): void {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance
): void {
  parentInstance.insertBefore(child, beforeChild);
}

export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance
): void {
  parentInstance.appendChild(child);
}

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: any,
  internalInstanceHandle: Fiber
): Instance {
  let parentNamespace: string = hostContext;
  const domElement: Instance = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace
  );
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance
): void {
  parentInstance.appendChild(child);
}

export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: string
): boolean {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  switch (type) {
    case "button":
    case "input":
    case "select":
    case "textarea":
      return !!props.autoFocus;
    case "img":
      return true;
    default:
      return false;
  }
}

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance(
  targetInstance: Node
): null | SuspenseInstance {
  let node = targetInstance.previousSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = (node as any).data as string;
      if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        if (depth === 0) {
          return node as any as SuspenseInstance;
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}

export function resetTextContent(domElement: Instance): void {
  setTextContent(domElement, "");
}

export function commitMount(
  domElement: Instance,
  type: string,
  newProps: Props,
  internalInstanceHandle: Object
): void {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  switch (type) {
    case "button":
    case "input":
    case "select":
    case "textarea":
      if (newProps.autoFocus) {
        (
          domElement as
            | HTMLButtonElement
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement
        ).focus();
      }
      return;
    case "img": {
      if ((newProps as any).src) {
        (domElement as HTMLImageElement).src = newProps.src;
      }
      return;
    }
  }
}

export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<any>,
  type: string,
  oldProps: Props,
  newProps: Props
): void {
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
}

export function removeChild(
  parentInstance: Instance,
  child: Instance | TextInstance | SuspenseInstance
): void {
  parentInstance.removeChild(child);
}

export function removeChildFromContainer(
  container: Container,
  child: Instance | TextInstance | SuspenseInstance
): void {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string
): void {
  textInstance.nodeValue = newText;
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
  rootContainerInstance: Container
): HostContext {
  const parentNamespace = parentHostContext;
  return getChildNamespace(parentNamespace, type);
}

export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Fiber
): TextInstance {
  const textNode: TextInstance = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export function getPublicInstance(instance: Instance): Instance {
  return instance;
}
