import * as ShioriJK from "shiorijk";
import { addMiddleware, checkMiddleware } from "./addMiddleware";
import { compose } from "./compose";
import { Middleware } from "./Middleware";

/** base context */
export interface BaseContext<State> {
  /** any state */
  state: State;
}

/** load() context */
export interface LoadContext<State> extends BaseContext<State> {
  /** load()'s argument */
  dirpath: string;
}

/** request() context */
export interface RequestContext<State> extends BaseContext<State> {
  /** request()'s argument */
  request: ShioriJK.Message.Request;
}

/** unload() context */
export type UnloadContext<State> = BaseContext<State>;

export type LoadResult = boolean;
export type RequestResult = ShioriJK.Message.Response;
export type UnloadResult = void;

export type LoadMiddleware<State> = Middleware<LoadContext<State>, LoadResult>;
export type RequestMiddleware<State> = Middleware<
  RequestContext<State>,
  RequestResult
>;
export type UnloadMiddleware<State> = Middleware<
  UnloadContext<State>,
  UnloadResult
>;

export interface ShioriMiddleware<State> {
  load?: LoadMiddleware<State>;
  request?: RequestMiddleware<State>;
  unload?: UnloadMiddleware<State>;
  state?: never;
}

export interface ShioriMiddlewareWithState<State, AddState> {
  load?: LoadMiddleware<State & AddState>;
  request?: RequestMiddleware<State & AddState>;
  unload?: UnloadMiddleware<State & AddState>;
  state: AddState;
}

export interface ShioriMiddlewares<State> {
  load?: Array<LoadMiddleware<State>>;
  request?: Array<RequestMiddleware<State>>;
  unload?: Array<UnloadMiddleware<State>>;
}

/** SHIORI subsystem interface builder  */
export class ShioriBuilder<State = Record<string, unknown>> {
  /** load middlewares */
  load: Array<LoadMiddleware<State>>;

  /** request middlewares */
  request: Array<RequestMiddleware<State>>;

  /** unload middlewares */
  unload: Array<UnloadMiddleware<State>>;

  /** state in context */
  state: State;

  /**
   * construct builder
   * @param state state in context
   * @param middlewares middlewares
   * @param check check middlewares
   */
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: State = {} as any,
    middlewares: ShioriMiddlewares<State> = {},
    check = true
  ) {
    this.state = state;
    this.load = middlewares.load || [];
    this.request = middlewares.request || [];
    this.unload = middlewares.unload || [];
    if (check) {
      for (const middleware of this.load) checkMiddleware(middleware);
      for (const middleware of this.request) checkMiddleware(middleware);
      for (const middleware of this.unload) checkMiddleware(middleware);
    }
  }

  /**
   * add middleware
   * @param middleware middleware with state
   */
  use(middleware: ShioriMiddleware<State>): ShioriBuilder<State>;
  use<AddState>(
    middleware: ShioriMiddlewareWithState<State, AddState>
  ): ShioriBuilder<State & AddState>;
  use<AddState = Record<string, unknown>>(
    middleware: ShioriMiddlewareWithState<State, AddState>
  ) {
    const newState = (middleware.state
      ? // tslint:disable-next-line prefer-object-spread
        { ...this.state, ...middleware.state }
      : this.state) as State & AddState;

    return new ShioriBuilder(
      newState,
      {
        load: middleware.load
          ? addMiddleware(this.load, middleware.load)
          : this.load,
        request: middleware.request
          ? addMiddleware(this.request, middleware.request)
          : this.request,
        unload: middleware.unload
          ? addMiddleware(this.unload, middleware.unload)
          : this.unload,
      },
      false
    );
  }

  /**
   * add load middleware
   * @param middleware middleware
   * @param state state
   */
  useLoad(middleware: LoadMiddleware<State>): ShioriBuilder<State>;
  useLoad<AddState>(
    middleware: LoadMiddleware<State & AddState>,
    state: AddState
  ): ShioriBuilder<State & AddState>;
  useLoad<AddState = Record<string, unknown>>(
    middleware: LoadMiddleware<State & AddState>,
    state?: AddState
  ) {
    return this.use({ load: middleware, state });
  }

  /**
   * add request middleware
   * @param middleware middleware
   * @param state state
   */
  useRequest(middleware: RequestMiddleware<State>): ShioriBuilder<State>;
  useRequest<AddState>(
    middleware: RequestMiddleware<State & AddState>,
    state: AddState
  ): ShioriBuilder<State & AddState>;
  useRequest<AddState = Record<string, unknown>>(
    middleware: RequestMiddleware<State & AddState>,
    state?: AddState
  ) {
    return this.use({ request: middleware, state });
  }

  /**
   * add unload middleware
   * @param middleware middleware
   * @param state state
   */
  useUnload(middleware: UnloadMiddleware<State>): ShioriBuilder<State>;
  useUnload<AddState>(
    middleware: UnloadMiddleware<State & AddState>,
    state: AddState
  ): ShioriBuilder<State & AddState>;
  useUnload<AddState = Record<string, unknown>>(
    middleware: UnloadMiddleware<State & AddState>,
    state?: AddState
  ) {
    return this.use({ unload: middleware, state });
  }

  /** build SHIORI interface */
  build() {
    return {
      load: this.buildLoad(),
      request: this.buildRequest(),
      unload: this.buildUnload(),
    };
  }

  /** build load() middleware */
  private buildLoad() {
    const middleware = compose(this.load);
    const { state } = this;

    return function load(dirpath: string) {
      const context = { dirpath, state };

      return middleware(context, function noNext() {
        return true;
      });
    };
  }

  /** build request() middleware */
  private buildRequest() {
    const middleware = compose(this.request);
    const { state } = this;
    const requestParser = new ShioriJK.Shiori.Request.Parser();

    return async function request(
      requestStr: string | ShioriJK.Message.Request
    ) {
      const requestObj =
        typeof requestStr === "string"
          ? requestParser.parse(requestStr)
          : requestStr;
      const context = { request: requestObj, state };
      const response = await middleware(context, function noNext() {
        return new ShioriJK.Message.Response();
      });

      return response.toString();
    };
  }

  /** build unload() middleware */
  private buildUnload() {
    const middleware = compose(this.unload);
    const { state } = this;

    return function unload() {
      const context = { state };

      return middleware(context, function noNext() {
        return undefined;
      });
    };
  }
}
