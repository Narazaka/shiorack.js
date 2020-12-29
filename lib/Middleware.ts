/** middleware */
export type Middleware<Context, Result> = (
  context: Context,
  next: NextStack<Result>
) => MiddlewareResult<Result>;
/** next() */
export type NextStack<Result> = () => MiddlewareResult<Result>;
/** middleware result */
export type MiddlewareResult<Result> = Result | Promise<Result>;
