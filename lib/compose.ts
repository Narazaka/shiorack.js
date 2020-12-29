import { Middleware } from "./Middleware";

/**
 * compose middlewares
 */
// from koa-compose https://github.com/koajs/compose
export function compose<Context, Result>(
  middlewares: Array<Middleware<Context, Result>>
): Middleware<Context, Result> {
  if (!Array.isArray(middlewares))
    throw new TypeError("Middleware stack must be an array!");
  for (const middleware of middlewares) {
    if (typeof middleware !== "function")
      throw new TypeError("Middleware must be composed of functions!");
  }

  return (context, next) => {
    let lastCalledIndex = -1;
    /**
     * dispatch middleware
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function dispatch(index: number): Promise<any> {
      if (index <= lastCalledIndex)
        throw new Error("next() called multiple times");
      lastCalledIndex = index;
      let middleware = middlewares[index];
      if (index === middlewares.length) middleware = next;

      // eslint-disable-next-line @typescript-eslint/no-shadow
      return middleware(context, function next() {
        return dispatch(index + 1);
      });
    }

    return dispatch(0);
  };
}
