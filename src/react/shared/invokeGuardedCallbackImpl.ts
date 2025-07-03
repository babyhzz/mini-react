function invokeGuardedCallbackProd<A, B, C, D, E, F, any>(
  name: string | null,
  func: (a: A, b: B, c: C, d: D, e: E, f: F) => any,
  context: any,
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
) {
  const funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
}

let invokeGuardedCallbackImpl = invokeGuardedCallbackProd;

export default invokeGuardedCallbackImpl;
