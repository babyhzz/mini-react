import { getChildHostContext, HostContext } from "../react-dom/ReactDOMHostConfig";
import { Container } from "./ReactFiberConfig";
import { createCursor, pop, push, StackCursor } from "./ReactFiberStack";
import { Fiber } from "./ReactInternalTypes";
declare class NoContextT {}
const NO_CONTEXT: NoContextT = {};

const contextStackCursor: StackCursor<HostContext | NoContextT> = createCursor(
  NO_CONTEXT,
);
const contextFiberStackCursor: StackCursor<Fiber | NoContextT> = createCursor(
  NO_CONTEXT,
);

// @ts-ignore
const rootInstanceStackCursor: StackCursor<
  Container
> = createCursor(NO_CONTEXT);

export function pushHostContainer(fiber: Fiber, nextRootInstance: Container) {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance);
}

export function getRootHostContainer(): Container {
  const rootInstance = rootInstanceStackCursor.current;
  return rootInstance;
}

export function popHostContainer(fiber: Fiber) {
  // pop(contextStackCursor);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
}

export function getHostContext(): HostContext {
  // TODO 类型不匹配
  const context = contextStackCursor.current;
  return context;
}

export function pushHostContext(fiber: Fiber): void {
  const rootInstance: Container = rootInstanceStackCursor.current;
  const context: HostContext = contextStackCursor.current as any;
  const nextContext = getChildHostContext(context, fiber.type, rootInstance);

  // Don't push this Fiber's context unless it's unique.
  if (context === nextContext) {
    return;
  }

  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  push(contextFiberStackCursor, fiber);
  push(contextStackCursor, nextContext);
}