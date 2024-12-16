import { createRoot as createRootImpl, RootType } from "./ReactDOMRoot";

function createRoot(
  container: Element | Document | DocumentFragment
): RootType {
  return createRootImpl(container);
}

export { createRoot };
