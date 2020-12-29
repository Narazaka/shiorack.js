import * as assert from "power-assert";
import { ShioriBuilder } from "../lib";

describe("basic", () => {
  it("construct", () => {
    const state = {};
    const builder = new ShioriBuilder(state);
    const shiori = builder.build();
    assert(shiori.load);
    assert(shiori.request);
    assert(shiori.unload);
  });
});
