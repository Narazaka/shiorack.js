import * as ShioriJK from "shiorijk";
import { Middleware } from "./Middleware";
import { MiddlewareBuilder } from "./MiddlewareBuilder";

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
export type RequestMiddleware<State> = Middleware<RequestContext<State>, RequestResult>;
export type UnloadMiddleware<State> = Middleware<UnloadContext<State>, UnloadResult>;

export interface ShioriMiddleware<State> {
    load?: LoadMiddleware<State>;
    request?: RequestMiddleware<State>;
    unload?: UnloadMiddleware<State>;
}

/** SHIORI subsystem interface builder  */
export class ShioriBuilder<State> {
    /** load middlewares */
    load = new MiddlewareBuilder<LoadContext<State>, LoadResult>();
    /** request middlewares */
    request = new MiddlewareBuilder<RequestContext<State>, RequestResult>();
    /** unload middlewares */
    unload = new MiddlewareBuilder<UnloadContext<State>, UnloadResult>();
    /** state in context */
    state: State;

    /**
     * construct builder
     * @param state state in context
     */
    constructor(state: State) {
        this.state = state;
    }

    /**
     * add middleware
     * @param middleware middleware
     */
    use(middleware: ShioriMiddleware<State>) {
        if (middleware.load) this.load.use(middleware.load);
        if (middleware.request) this.request.use(middleware.request);
        if (middleware.unload) this.unload.use(middleware.unload);

        return this;
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
        const middleware = this.load.build();
        const state = this.state;

        return function load(dirpath: string) {
            const context = { dirpath, state };

            return middleware(context, function noNext() { return true; });
        };
    }

    /** build request() middleware */
    private buildRequest() {
        const middleware = this.request.build();
        const state = this.state;
        const requestParser = new ShioriJK.Shiori.Request.Parser();

        return async function request(requestStr: string) {
            const context = { request: requestParser.parse(requestStr), state };
            const response = await middleware(context, function noNext() { return new ShioriJK.Message.Response(); });

            return response.toString();
        };
    }

    /** build unload() middleware */
    private buildUnload() {
        const middleware = this.unload.build();
        const state = this.state;

        return function unload() {
            const context = { state };

            return middleware(context, function noNext() { return undefined; });
        };
    }
}
