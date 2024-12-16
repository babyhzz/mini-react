import { DOMEventName } from "./DOMEventNames";
import { DefaultEventPriority, EventPriority } from "../react-reconciler/ReactEventPriorities";
import { getEventPriority } from "./ReactDOMEventListener";

export function getCurrentEventPriority(): EventPriority {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type as DOMEventName);
}