/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type ReactElement = any;

export type ReactNode =
  | ReactElement
  | ReactPortal
  | ReactText
  | ReactFragment
  | ReactProvider<any>
  | ReactConsumer<any>;

export type ReactEmpty = null | void | boolean;

export type ReactFragment = ReactEmpty | Iterable<ReactNode>;

export type ReactNodeList = ReactEmpty | ReactNode;

export type ReactText = string | number;

export type ReactProvider<T> = {
  $$typeof: symbol | number,
  type: ReactContext<T>,
  key: null | string,
  ref: null,
  props: {
    value: T,
    children?: ReactNodeList,
  },
};

export type ReactConsumerType<T> = {
  $$typeof: symbol | number,
  _context: ReactContext<T>,
};

export type ReactConsumer<T> = {
  $$typeof: symbol | number,
  type: ReactConsumerType<T>,
  key: null | string,
  ref: null,
  props: {
    children: (value: T) => ReactNodeList,
  },
};

export type ReactContext<T> = {
  $$typeof: symbol | number,
  Consumer: ReactConsumerType<T>,
  Provider: ReactContext<T>,
  _currentValue: T,
  _currentValue2: T,
  _threadCount: number,
  // DEV only
  _currentRenderer?: Object | null,
  _currentRenderer2?: Object | null,
  // This value may be added by application code
  // to improve DEV tooling display names
  displayName?: string,
};

export type ReactPortal = {
  $$typeof: symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
};

export type RefObject = {
  current: any,
};

export type ReactScope = {
  $$typeof: symbol | number,
};
