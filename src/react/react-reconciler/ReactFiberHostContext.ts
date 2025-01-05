import { Container } from "./ReactFiberConfig";
import { createCursor, push, StackCursor } from "./ReactFiberStack";
import { Fiber } from "./ReactInternalTypes";
declare class NoContextT {}
const NO_CONTEXT: NoContextT = {};

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