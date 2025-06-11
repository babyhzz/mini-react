import { Dispatcher } from "../react-reconciler/ReactInternalTypes";
/**
 * Keeps track of the current dispatcher.
 */
const ReactCurrentDispatcher = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null as  (null | Dispatcher),
};

export default ReactCurrentDispatcher;
