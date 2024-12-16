import type { EventPriority } from "../react-reconciler/ReactEventPriorities";

import { getEventPriority } from "./ReactDOMEventListener";
import {
  NoEventPriority,
  DefaultEventPriority,
} from "../react-reconciler/ReactEventPriorities";

import ReactDOMSharedInternals from "../react-dom/ReactDOMSharedInternals";
import { DOMEventName } from "./DOMEventNames";

export function setCurrentUpdatePriority(newPriority: EventPriority): void {
  ReactDOMSharedInternals.p /* currentUpdatePriority */ = newPriority;
}

export function getCurrentUpdatePriority(): EventPriority {
  return ReactDOMSharedInternals.p; /* currentUpdatePriority */
}

export function resolveUpdatePriority(): EventPriority {
  const updatePriority = ReactDOMSharedInternals.p; /* currentUpdatePriority */
  if (updatePriority !== NoEventPriority) {
    return updatePriority;
  }

  // hc 这个是不是废弃了
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type as DOMEventName);
}

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(priority);
    return fn();
  } finally {
    setCurrentUpdatePriority(previousPriority);
  }
}
