import { DOMEventName } from "./DOMEventNames";
import { DefaultEventPriority, EventPriority } from "../react-reconciler/ReactEventPriorities";
import { getEventPriority } from "./ReactDOMEventListener";

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