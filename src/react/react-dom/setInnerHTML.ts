import { SVG_NAMESPACE } from "./DOMNamespaces";

const setInnerHTML = function (
  node: Element,
  html: { valueOf(): { toString(): string } }
): void {
  if (node.namespaceURI === SVG_NAMESPACE) {
    if (!("innerHTML" in node)) {
      // hc: 这是删除所有子节点的方式？
      while (node.firstChild) {
        node.removeChild(node.firstChild);
        return;
      }
    }
  }
  node.innerHTML = html as any;
};

export default setInnerHTML;
