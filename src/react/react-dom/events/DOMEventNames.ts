/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type DOMEventName =
  | "abort"
  | "afterblur" // Not a real event. This is used by event experiments.
  | "beforeblur" // Not a real event. This is used by event experiments.
  | "beforeinput"
  | "blur"
  | "canplay"
  | "canplaythrough"
  | "cancel"
  | "change"
  | "click"
  | "close"
  | "compositionend"
  | "compositionstart"
  | "compositionupdate"
  | "contextmenu"
  | "copy"
  | "cut"
  | "dblclick"
  | "auxclick"
  | "drag"
  | "dragend"
  | "dragenter"
  | "dragexit"
  | "dragleave"
  | "dragover"
  | "dragstart"
  | "drop"
  | "durationchange"
  | "emptied"
  | "encrypted"
  | "ended"
  | "error"
  | "focus"
  | "focusin"
  | "focusout"
  | "fullscreenchange"
  | "gotpointercapture"
  | "hashchange"
  | "input"
  | "invalid"
  | "keydown"
  | "keypress"
  | "keyup"
  | "load"
  | "loadstart"
  | "loadeddata"
  | "loadedmetadata"
  | "lostpointercapture"
  | "message"
  | "mousedown"
  | "mouseenter"
  | "mouseleave"
  | "mousemove"
  | "mouseout"
  | "mouseover"
  | "mouseup"
  | "paste"
  | "pause"
  | "play"
  | "playing"
  | "pointercancel"
  | "pointerdown"
  | "pointerenter"
  | "pointerleave"
  | "pointermove"
  | "pointerout"
  | "pointerover"
  | "pointerup"
  | "popstate"
  | "progress"
  | "ratechange"
  | "reset"
  | "resize"
  | "scroll"
  | "seeked"
  | "seeking"
  | "select"
  | "selectstart"
  | "selectionchange"
  | "stalled"
  | "submit"
  | "suspend"
  | "textInput" // Intentionally camelCase. Non-standard.
  | "timeupdate"
  | "toggle"
  | "touchcancel"
  | "touchend"
  | "touchmove"
  | "touchstart"
  // These are vendor-prefixed so you should use the exported constants instead:
  // 'transitionend' |
  | "volumechange"
  | "waiting"
  | "wheel"
  // hc 我加的类型
  | "animationend"
  | "animationiteration"
  | "animationstart"
  | "transitionend";

// hc 省去了设备区别
export const ANIMATION_END: DOMEventName = "animationend";
export const ANIMATION_ITERATION: DOMEventName = "animationiteration";
export const ANIMATION_START: DOMEventName = "animationstart";
export const TRANSITION_END: DOMEventName = "transitionend";
