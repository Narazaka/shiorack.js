/**
 * add middleware with type check
 * @param middleware middleware
 */
export function addMiddleware(
    middlewares: any[],
    middleware: any,
) {
    // tslint:disable-next-line strict-type-predicates
    checkMiddleware(middleware);

    return middlewares.concat([middleware]);
}

/**
 * check middleware type
 * @param middleware middleware
 */
export function checkMiddleware<T>(middleware: T) {
    if (typeof middleware !== "function") throw new TypeError("middleware must be a function!");
}
