# [shiorack.js](https://github.com/Narazaka/shiorack.js)

[![npm](https://img.shields.io/npm/v/shiorack.svg)](https://www.npmjs.com/package/shiorack)
[![npm license](https://img.shields.io/npm/l/shiorack.svg)](https://www.npmjs.com/package/shiorack)
[![npm download total](https://img.shields.io/npm/dt/shiorack.svg)](https://www.npmjs.com/package/shiorack)
[![npm download by month](https://img.shields.io/npm/dm/shiorack.svg)](https://www.npmjs.com/package/shiorack)

[![Dependency Status](https://david-dm.org/Narazaka/shiorack.js/status.svg)](https://david-dm.org/Narazaka/shiorack.js)
[![devDependency Status](https://david-dm.org/Narazaka/shiorack.js/dev-status.svg)](https://david-dm.org/Narazaka/shiorack.js?type=dev)
[![Travis Build Status](https://travis-ci.org/Narazaka/shiorack.js.svg?branch=master)](https://travis-ci.org/Narazaka/shiorack.js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/Narazaka/shiorack.js?svg=true&branch=master)](https://ci.appveyor.com/project/Narazaka/shiorack-js)
[![codecov.io](https://codecov.io/github/Narazaka/shiorack.js/coverage.svg?branch=master)](https://codecov.io/github/Narazaka/shiorack.js?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/Narazaka/shiorack.js.svg)](https://greenkeeper.io/)

Middleware based Ukagaka SHIORI subsystem interface builder inspired by rack and koa

## Install

```bash
npm install shiorack
```

## Usage

```typescript
/// <reference types="node" />

import { NoContent, OK, wrapRequestCallback } from "shiori-request-helper";
import * as ShioriJK from "shiorijk";
import { ShioriBuilder } from "shiorack";

class State {
    dirpath: string;
    defaultHeaders: {[name: string]: string} = {};
}

const state = new State();

state.defaultHeaders.Charset = "UTF-8";

const builder = new ShioriBuilder(state);

builder.use({
    // set dirpath
    load: (ctx, next) => {
        ctx.state.dirpath = ctx.dirpath;

        return next();
    },
    // error handler
    request: async (ctx, next) => {
        try {
            return await next();
        } catch (error) {
            return new ShioriJK.Message.Response({
                status_line: {code: 400, version: "3.0"},
                headers: {
                    ...ctx.state.defaultHeaders,
                    "X-Shiori-Error": error.message.replace(/\r?\n/g, "\\n"),
                },
            });
        }
    },
    // exit
    unload: async (_ctx, next) => {
        await next();
        process.exit();
    },
});

// ignore OnTranslate
builder.request.use((ctx, next) => {
    if (ctx.request.headers.ID === "OnTranslate") {
        return new ShioriJK.Message.Response({
            status_line: {code: 400, version: "3.0"},
            headers: {
                Charset: "UTF-8",
            },
        });
    }

    return next();
});

// set ghost name to sender
builder.request.use((ctx, next) => {
    if (ctx.request.headers.ID === "ownerghostname") {
        const sender = ctx.request.headers.Reference(0);
        if (typeof sender === "string" && sender.length) {
            ctx.state.defaultHeaders.Sender = sender;
        }
    }

    return next();
});

// process request events
const requestCallback = wrapRequestCallback(
    (request: ShioriJK.Message.Request) => {
        switch (request.headers.ID) {
            case "OnBoot": return OK("\\h\\s[0]hello.\\e");
            default: return NoContent();
        }
    },
    state.defaultHeaders,
);

builder.request.use((ctx) => requestCallback(ctx.request));

// tslint:disable-next-line no-default-export
export default builder.build(); // build SHIORI interface

```

```bash
shiolinkjs ./myShiori.js
```

## API Document

[https://narazaka.github.io/shiorack.js/](https://narazaka.github.io/shiorack.js/)

## License

This is released under [MIT License](http://narazaka.net/license/MIT?2018).
