/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { DOMEventName } from "../DOMEventNames";
import type { DispatchQueue } from "../DOMPluginEventSystem";
import type { EventSystemFlags } from "../EventSystemFlags";
import type { AnyNativeEvent } from "../PluginModuleType";

import {
  SyntheticAnimationEvent,
  SyntheticClipboardEvent,
  SyntheticDragEvent,
  SyntheticEvent,
  SyntheticFocusEvent,
  SyntheticKeyboardEvent,
  SyntheticMouseEvent,
  SyntheticPointerEvent,
  SyntheticTouchEvent,
  SyntheticTransitionEvent,
  SyntheticUIEvent,
  SyntheticWheelEvent,
} from "../SyntheticEvent";

import {
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  TRANSITION_END,
} from "../DOMEventNames";
import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties";
import {
  accumulateSinglePhaseListeners
} from "../DOMPluginEventSystem";

import { IS_CAPTURE_PHASE } from "../EventSystemFlags";

import { Fiber } from "../../../react-reconciler/ReactInternalTypes";

function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget
): void {
  const reactName = topLevelEventsToReactNames.get(domEventName);
  if (reactName === undefined) {
    return;
  }
  let SyntheticEventCtor = SyntheticEvent;
  let reactEventType: string = domEventName;
  switch (domEventName) {
    case "keypress":
    case "keydown":
    case "keyup":
      SyntheticEventCtor = SyntheticKeyboardEvent;
      break;
    case "focusin":
      reactEventType = "focus";
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case "focusout":
      reactEventType = "blur";
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case "beforeblur":
    case "afterblur":
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case "click":
    case "auxclick":
    case "dblclick":
    case "mousedown":
    case "mousemove":
    case "mouseup":
    // TODO: Disabled elements should not respond to mouse events
    /* falls through */
    case "mouseout":
    case "mouseover":
    case "contextmenu":
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    case "drag":
    case "dragend":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "dragstart":
    case "drop":
      SyntheticEventCtor = SyntheticDragEvent;
      break;
    case "touchcancel":
    case "touchend":
    case "touchmove":
    case "touchstart":
      SyntheticEventCtor = SyntheticTouchEvent;
      break;
    case ANIMATION_END:
    case ANIMATION_ITERATION:
    case ANIMATION_START:
      SyntheticEventCtor = SyntheticAnimationEvent;
      break;
    case TRANSITION_END:
      SyntheticEventCtor = SyntheticTransitionEvent;
      break;
    case "scroll":
      SyntheticEventCtor = SyntheticUIEvent;
      break;
    case "wheel":
      SyntheticEventCtor = SyntheticWheelEvent;
      break;
    case "copy":
    case "cut":
    case "paste":
      SyntheticEventCtor = SyntheticClipboardEvent;
      break;
    case "gotpointercapture":
    case "lostpointercapture":
    case "pointercancel":
    case "pointerdown":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "pointerup":
      SyntheticEventCtor = SyntheticPointerEvent;
      break;
    default:
      // Unknown event. This is used by createEventHandle.
      break;
  }

  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  // Some events don't bubble in the browser.
  // In the past, React has always bubbled them, but this can be surprising.
  // We're going to try aligning closer to the browser behavior by not bubbling
  // them in React either. We'll start by not bubbling onScroll, and then expand.
  // hc: 判断是否只在目标触发，而不冒泡，注意 scroll 事件不冒泡，但支持捕获！！！可以看英文注释。
  const accumulateTargetOnly = !inCapturePhase && domEventName === "scroll";

  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    inCapturePhase,
    accumulateTargetOnly,
    nativeEvent
  );
  if (listeners.length > 0) {
    // Intentionally create event lazily.
    // @ts-ignore by hc
    const event = new SyntheticEventCtor(
      reactName,
      reactEventType,
      null,
      nativeEvent,
      nativeEventTarget
    );
    dispatchQueue.push({ event, listeners });
  }
}

export { extractEvents, registerSimpleEvents as registerEvents };

