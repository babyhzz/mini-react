import {TEXT_NODE} from './HTMLNodeType';

/**
 * Set the textContent property of a node. For text updates, it's faster
 * to set the `nodeValue` of the Text node directly instead of using
 * `.textContent` which will remove the existing node and create a new one.
 * 
 *
 * @param {DOMElement} node
 * @param {string} text
 * @internal
 */
const setTextContent = function(node: Element, text: string): void {
  if (text) {
    const firstChild = node.firstChild;

    if (
      firstChild &&
      firstChild === node.lastChild &&
      firstChild.nodeType === TEXT_NODE
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }

  // hc: textContent 比 innerText 更高效
  node.textContent = text;
};

export default setTextContent;
