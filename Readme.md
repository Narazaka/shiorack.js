# [shiorack.js](https://github.com/Narazaka/shiorack.js)

[![npm](https://img.shields.io/npm/v/shiorack.svg)](https://www.npmjs.com/package/shiorack)
[![npm license](https://img.shields.io/npm/l/shiorack.svg)](https://www.npmjs.com/package/shiorack)
[![npm download total](https://img.shields.io/npm/dt/shiorack.svg)](https://www.npmjs.com/package/shiorack)
[![npm download by month](https://img.shields.io/npm/dm/shiorack.svg)](https://www.npmjs.com/package/shiorack)

[![Dependency Status](https://david-dm.org/Narazaka/shiorack.js/status.svg)](https://david-dm.org/Narazaka/shiorack.js)
[![devDependency Status](https://david-dm.org/Narazaka/shiorack.js/dev-status.svg)](https://david-dm.org/Narazaka/shiorack.js?type=dev)
[![test](https://github.com/Narazaka/shiorack.js/workflows/test/badge.svg)](https://github.com/Narazaka/shiorack.js/actions?query=workflow:test)
[![codecov.io](https://codecov.io/github/Narazaka/shiorack.js/coverage.svg?branch=master)](https://codecov.io/github/Narazaka/shiorack.js?branch=master)

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

interface HeadersState {
  defaultHeaders: { [name: string]: string };
}

const builder = new ShioriBuilder()
  .use({
    state: {} as { dirpath: string },
    // set dirpath
    load: (ctx, next) => {
      ctx.state.dirpath = ctx.dirpath;

      return next();
    },
    // exit
    unload: async (_ctx, next) => {
      await next();
      process.exit();
    },
  })
  .use({
    state: {
      defaultHeaders: { Charset: "UTF-8" },
    } as HeadersState,
    // error handler
    request: async (ctx, next) => {
      try {
        return await next();
      } catch (error) {
        return new ShioriJK.Message.Response({
          status_line: { code: 400, version: "3.0" },
          headers: {
            ...ctx.state.defaultHeaders,
            "X-Shiori-Error": error.message.replace(/\r?\n/g, "\\n"),
          },
        });
      }
    },
  })
  // ignore OnTranslate
  .useRequest((ctx, next) => {
    if (ctx.request.headers.ID === "OnTranslate") {
      return new ShioriJK.Message.Response({
        status_line: { code: 400, version: "3.0" },
        headers: {
          Charset: "UTF-8",
        },
      });
    }

    return next();
  })
  // set ghost name to sender
  .useRequest((ctx, next) => {
    if (ctx.request.headers.ID === "ownerghostname") {
      const sender = ctx.request.headers.Reference(0);
      if (typeof sender === "string" && sender.length) {
        ctx.state.defaultHeaders.Sender = sender;
        ctx.state.sender = sender;
      }
    }

    return next();
  }, {} as { sender: string });

// process request events
const requestCallback = wrapRequestCallback(
  (request: ShioriJK.Message.Request) => {
    switch (request.headers.ID) {
      case "OnBoot":
        return OK("\\h\\s[0]hello.\\e");
      default:
        return NoContent();
    }
  },
  builder.state.defaultHeaders
);

const builder2 = builder.useRequest((ctx) => requestCallback(ctx.request));

export default builder2.build(); // build SHIORI interface
```

```bash
shiolinkjs ./myShiori.js
```

## API Document

[https://narazaka.github.io/shiorack.js/](https://narazaka.github.io/shiorack.js/)

## License

This is released under [MIT License](http://narazaka.net/license/MIT?2018).
