import { SuspenseInstance } from "../react-dom/ReactDOMHostConfig";
import { Lane } from "./ReactFiberLane";
import { TreeContext } from "./ReactFiberTreeContext";

export type SuspenseState = {
  // If this boundary is still dehydrated, we store the SuspenseInstance
  // here to indicate that it is dehydrated (flag) and for quick access
  // to check things like isSuspenseInstancePending.
  dehydrated: null | SuspenseInstance,
  treeContext: null | TreeContext,
  // Represents the lane we should attempt to hydrate a dehydrated boundary at.
  // OffscreenLane is the default for dehydrated boundaries.
  // NoLane is the default for normal boundaries, which turns into "normal" pri.
  retryLane: Lane,
};