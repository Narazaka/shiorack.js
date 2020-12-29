import { Middleware } from "./Middleware";

/**
 * check middleware type
 * @param middleware middleware
 */
export function checkMiddleware<T>(middleware: T) {
  if (typeof middleware !== "function")
    throw new TypeError("middleware must be a function!");
}

/**
 * add middleware with type check
 * @param middleware middleware
 */
export function addMiddleware(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middlewares: Middleware<any, any>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middleware: Middleware<any, any>
) {
  checkMiddleware(middleware);

  return middlewares.concat([middleware]);
}
