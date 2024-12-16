React 一些参数移除，createRoot 的一些参数，后续碰到相关逻辑移除
```js
  unstable_strictMode?: boolean,
  unstable_transitionCallbacks?: TransitionTracingCallbacks,
  identifierPrefix?: string,
  onUncaughtError?: (
    error: any,
    errorInfo: { componentStack?: string},
  ) => void,
  onCaughtError?: (
    error: any,
    errorInfo: {
      componentStack?: string,
      errorBoundary?: any,
    },
  ) => void,
  onRecoverableError?: (
    error: any,
    errorInfo: {componentStack?: string},
  ) => void,
```

仅调试客户端渲染，





getContextForSubtree