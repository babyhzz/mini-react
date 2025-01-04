import { Fiber } from "../react-reconciler/ReactInternalTypes";

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
const ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null as (null | Fiber),
};

export default ReactCurrentOwner;
