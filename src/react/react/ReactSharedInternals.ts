/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactCurrentDispatcher from './ReactCurrentDispatcher';
import ReactCurrentOwner from './ReactCurrentOwner';

const ReactSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentOwner,
};

export default ReactSharedInternals;
