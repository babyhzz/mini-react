export type EventSystemFlags = number;

export const IS_EVENT_HANDLE_NON_MANAGED_NODE = 1;
export const IS_NON_DELEGATED = 1 << 1;
export const IS_CAPTURE_PHASE = 1 << 2;
export const IS_PASSIVE = 1 << 3;
export const IS_LEGACY_FB_SUPPORT_MODE = 1 << 4;

// We do not want to defer if the event system has already been
// set to LEGACY_FB_SUPPORT. LEGACY_FB_SUPPORT only gets set when
// we call willDeferLaterForLegacyFBSupport, thus not bailing out
// will result in endless cycles like an infinite loop.
// We also don't want to defer during event replaying.
export const SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS =
  IS_EVENT_HANDLE_NON_MANAGED_NODE | IS_NON_DELEGATED | IS_CAPTURE_PHASE;
