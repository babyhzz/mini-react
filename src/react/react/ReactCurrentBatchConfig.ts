/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { BatchConfigTransition } from "../react-reconciler/ReactFiberTracingMarkerComponent";

type BatchConfig = {
  transition: BatchConfigTransition | null;
};
/**
 * Keeps track of the current batch's configuration such as how long an update
 * should suspend for if it needs to.
 */
const ReactCurrentBatchConfig: BatchConfig = {
  transition: null,
};

export default ReactCurrentBatchConfig;
