import { DOMEventName } from "./DOMEventNames";
import { DefaultEventPriority, EventPriority } from "../react-reconciler/ReactEventPriorities";
import { getEventPriority } from "./ReactDOMEventListener";
import { Container } from "../react-reconciler/ReactFiberConfig";
import { createElement } from "./ReactDOMComponent";
import { precacheFiberNode, updateFiberProps } from "./ReactDOMComponentTree";
import { Fiber } from "../react-reconciler/ReactInternalTypes";

export type Type = string;
export type Props = {
  autoFocus?: boolean,
  children?: any,
  disabled?: boolean,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
  dangerouslySetInnerHTML?: any,
  style?: Record<string, any>,
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
  [key: string]: any;
};

export type Instance = Element;
export type TextInstance = Text;
export type PublicInstance = Element | Text;

export function getCurrentEventPriority(): EventPriority {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type as DOMEventName);
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: any,
  internalInstanceHandle: Fiber,
): Instance {
  let parentNamespace: string = hostContext;
  const domElement: Instance = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}
