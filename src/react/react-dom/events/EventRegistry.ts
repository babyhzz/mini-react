/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from './DOMEventNames';

export const allNativeEvents: Set<DOMEventName> = new Set();

/**
 * Mapping from registration name to event name
 * hc: 建立合成事件（Synthetic Events）与原生事件（Native Events）之间的映射关系，
 * 注意映射的原生事件为一个数组
 * {
  // 基础事件
  onClick: ['click'],
  onClickCapture: ['click'],
  // 复杂事件
  onChange: ['change', 'click', 'input', 'keydown', 'focusout', ...],
  onChangeCapture: ['change', 'click', 'input', 'keydown', 'focusout', ...],
  // 特殊事件
  onSelect: ['mousedown', 'mouseup', 'selectionchange', ...],
  // ...其他事件
}
 */

export const registrationNameDependencies = {};

export function registerTwoPhaseEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>,
): void {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + 'Capture', dependencies);
}

export function registerDirectEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>,
) {
  registrationNameDependencies[registrationName] = dependencies;

  for (let i = 0; i < dependencies.length; i++) {
    // hc: dependencies 可能会存在重复，所以 allNativeEvents 为 Set
    allNativeEvents.add(dependencies[i]);
  }
}
