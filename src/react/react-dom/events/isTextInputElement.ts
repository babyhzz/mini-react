const supportedInputTypes: {[key: string]: true | void} = {
  color: true,
  date: true,
  datetime: true,
  'datetime-local': true,
  email: true,
  month: true,
  number: true,
  password: true,
  range: true,
  search: true,
  tel: true,
  text: true,
  time: true,
  url: true,
  week: true,
};

function isTextInputElement(elem?: HTMLElement): boolean {
  // hc: 如果是元素节点，nodeName 属性和 tagName 属性返回相同的值，
  // hc: 但如果是文本节点，nodeName 属性会返回 "#text"，而 tagName 属性会返回 undefined。
  const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();

  if (nodeName === 'input') {
    return !!supportedInputTypes[(elem as HTMLInputElement).type];
  }

  if (nodeName === 'textarea') {
    return true;
  }

  return false;
}

export default isTextInputElement;
