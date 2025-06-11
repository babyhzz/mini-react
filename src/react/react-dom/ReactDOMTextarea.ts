import { getToStringValue, toString } from "./ToStringValue";

export function updateWrapper(element: Element, props: any) {
  const node = element as any;
  const value = getToStringValue(props.value);
  const defaultValue = getToStringValue(props.defaultValue);
  if (value != null) {
    // Cast `value` to a string to ensure the value is set correctly. While
    // browsers typically do this as necessary, jsdom doesn't.
    const newValue = toString(value);
    // To avoid side effects (such as losing text selection), only set value if changed
    if (newValue !== node.value) {
      node.value = newValue;
    }
    if (props.defaultValue == null && node.defaultValue !== newValue) {
      node.defaultValue = newValue;
    }
  }
  if (defaultValue != null) {
    node.defaultValue = toString(defaultValue);
  }
}