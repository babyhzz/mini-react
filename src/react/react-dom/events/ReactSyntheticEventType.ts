import { Fiber } from "../../react-reconciler/ReactInternalTypes";
import type { DOMEventName } from "./DOMEventNames";

export type DispatchConfig = {
  dependencies?: Array<DOMEventName>;
  phasedRegistrationNames: {
    bubbled: null | string;
    captured: null | string;
  };
  registrationName?: string;
};

type BaseSyntheticEvent = {
  isPersistent: () => boolean;
  isPropagationStopped: () => boolean;
  _dispatchInstances?: null | Array<Fiber | null> | Fiber;
  _dispatchListeners?: null | Array<Function> | Function;
  _targetInst: Fiber;
  nativeEvent: Event;
  target?: any;
  relatedTarget?: any;
  type: string;
  currentTarget: null | EventTarget;
};

export type KnownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: string;
};
export type UnknownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: null;
};

export type ReactSyntheticEvent =
  | KnownReactSyntheticEvent
  | UnknownReactSyntheticEvent;
