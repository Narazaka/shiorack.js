import { compose } from "./compose";
import { Middleware } from "./Middleware";

/** middleware builder */
// tslint:disable max-classes-per-file
export class MiddlewareBuilder<Context, Result> {
    /** middlewares */
    middlewares: Array<Middleware<Context, Result>> = [];

    /**
     * add middleware
     * @param middleware middleware
     */
    use(middleware: Middleware<Context, Result>) {
        // tslint:disable-next-line strict-type-predicates
        if (typeof middleware !== "function") throw new TypeError("middleware must be a function!");
        this.middlewares.push(middleware);

        return this;
    }

    /** build to one middleware */
    build() {
        return compose(this.middlewares);
    }
}
