import * as assert from "power-assert";
import { ShioriBuilder } from "../lib";

describe("basic", () => {
  it("construct", () => {
    const state = {};
    const builder = new ShioriBuilder(state);
    const shiori = builder.build();
    assert(typeof shiori.load === "function");
    assert(typeof shiori.request === "function");
    assert(typeof shiori.unload === "function");
  });
});
