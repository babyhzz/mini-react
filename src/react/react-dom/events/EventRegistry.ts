import type {DOMEventName} from './DOMEventNames';

export const allNativeEvents: Set<DOMEventName> = new Set();

// hc: 建立合成事件（Synthetic Events）与原生事件（Native Events）之间的映射关系
// 比如 onChange 并不对应一个原生事件，它需要同时监听多个事件来实现跨平台、跨浏览器一致性：
// onChange: ['change', 'click', 'input', 'keydown', 'focusout', ...],
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
