/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type DOMEventName =
  | 'abort'
  | 'afterblur' // Not a real event. This is used by event experiments.
  // These are vendor-prefixed so you should use the exported constants instead:
  // 'animationiteration' |
  // 'animationend |
  // 'animationstart' |
  | 'beforeblur' // Not a real event. This is used by event experiments.
  | 'beforeinput'
  | 'beforetoggle'
  | 'blur'
  | 'canplay'
  | 'canplaythrough'
  | 'cancel'
  | 'change'
  | 'click'
  | 'close'
  | 'compositionend'
  | 'compositionstart'
  | 'compositionupdate'
  | 'contextmenu'
  | 'copy'
  | 'cut'
  | 'dblclick'
  | 'auxclick'
  | 'drag'
  | 'dragend'
  | 'dragenter'
  | 'dragexit'
  | 'dragleave'
  | 'dragover'
  | 'dragstart'
  | 'drop'
  | 'durationchange'
  | 'emptied'
  | 'encrypted'
  | 'ended'
  | 'error'
  | 'focus'
  | 'focusin'
  | 'focusout'
  | 'fullscreenchange'
  | 'gotpointercapture'
  | 'hashchange'
  | 'input'
  | 'invalid'
  | 'keydown'
  | 'keypress'
  | 'keyup'
  | 'load'
  | 'loadstart'
  | 'loadeddata'
  | 'loadedmetadata'
  | 'lostpointercapture'
  | 'message'
  | 'mousedown'
  | 'mouseenter'
  | 'mouseleave'
  | 'mousemove'
  | 'mouseout'
  | 'mouseover'
  | 'mouseup'
  | 'paste'
  | 'pause'
  | 'play'
  | 'playing'
  | 'pointercancel'
  | 'pointerdown'
  | 'pointerenter'
  | 'pointerleave'
  | 'pointermove'
  | 'pointerout'
  | 'pointerover'
  | 'pointerup'
  | 'popstate'
  | 'progress'
  | 'ratechange'
  | 'reset'
  | 'resize'
  | 'scroll'
  | 'scrollend'
  | 'seeked'
  | 'seeking'
  | 'select'
  | 'selectstart'
  | 'selectionchange'
  | 'stalled'
  | 'submit'
  | 'suspend'
  | 'textInput' // Intentionally camelCase. Non-standard.
  | 'timeupdate'
  | 'toggle'
  | 'touchcancel'
  | 'touchend'
  | 'touchmove'
  | 'touchstart'
  // These are vendor-prefixed so you should use the exported constants instead:
  // 'transitionrun' |
  // 'transitionstart' |
  // 'transitioncancel' |
  // 'transitionend' |
  | 'volumechange'
  | 'waiting'
  | 'wheel';
