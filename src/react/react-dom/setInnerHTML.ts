import { SVG_NAMESPACE } from "./DOMNamespaces";

const setInnerHTML = function (
  node: any,
  html: { valueOf(): { toString(): string } }
): void {
  if (node.namespaceURI === SVG_NAMESPACE) {
    if (!("innerHTML" in node)) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
        return;
      }
    }
  }
  node.innerHTML = html as any;
};

export default setInnerHTML;
