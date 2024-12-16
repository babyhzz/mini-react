/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from '../react-reconciler/ReactEventPriorities';
import type {HostDispatcher} from './ReactDOMTypes';

// This should line up with NoEventPriority from react-reconciler/src/ReactEventPriorities
// but we can't depend on the react-reconciler from this isomorphic code.
export const NoEventPriority: EventPriority = 0;

type ReactDOMInternals = {
  d /* ReactDOMCurrentDispatcher */: HostDispatcher,
  p /* currentUpdatePriority */: EventPriority,
  findDOMNode:
    | null
    | ((
        componentOrElement: any,
      ) => null | Element | Text),
};

function noop() {}

const DefaultDispatcher: HostDispatcher = {
  f /* flushSyncWork */: noop,
  r /* requestFormReset */: noop,
  D /* prefetchDNS */: noop,
  C /* preconnect */: noop,
  L /* preload */: noop,
  m /* preloadModule */: noop,
  X /* preinitScript */: noop,
  S /* preinitStyle */: noop,
  M /* preinitModuleScript */: noop,
};

const Internals: ReactDOMInternals = {
  d /* ReactDOMCurrentDispatcher */: DefaultDispatcher,
  p /* currentUpdatePriority */: NoEventPriority,
  findDOMNode: null,
};

export default Internals;
