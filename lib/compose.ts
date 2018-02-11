import { Middleware } from "./Middleware";

/**
 * compose middlewares
 */
// from koa-compose https://github.com/koajs/compose
export function compose<Context, Result>(middlewares: Array<Middleware<Context, Result>>): Middleware<Context, Result> {
    if (!Array.isArray(middlewares)) throw new TypeError("Middleware stack must be an array!");
    for (const middleware of middlewares) {
        // tslint:disable-next-line strict-type-predicates
        if (typeof middleware !== "function") throw new TypeError("Middleware must be composed of functions!");
    }

    // tslint:disable-next-line promise-function-async
    return ((context, next) => {
        let lastCalledIndex = -1;
        /**
         * dispatch middleware
         */
        // tslint:disable-next-line promise-function-async
        async function dispatch(index: number): Promise<any> {
            if (index <= lastCalledIndex) throw new Error("next() called multiple times");
            lastCalledIndex = index;
            let middleware = middlewares[index];
            if (index === middlewares.length) middleware = next;

            // tslint:disable-next-line no-shadowed-variable promise-function-async
            return middleware(context, function next() { return dispatch(index + 1); });
        }

        return dispatch(0);
    });
}
