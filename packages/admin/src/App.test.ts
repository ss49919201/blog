import * as v from "valibot";
import { expect, test } from "vitest";
import { parseRoute } from "./App";
import { PostIdSchema } from "./types/post";

test("a post hash opens the edit screen", () => {
  expect(parseRoute("#/posts/hello-world")).toEqual({
    page: "edit",
    id: v.parse(PostIdSchema, "hello-world"),
  });
});

test("any other hash stays on the list", () => {
  expect(parseRoute("")).toEqual({ page: "list" });
  expect(parseRoute("#/")).toEqual({ page: "list" });
  expect(parseRoute("#/posts/NOT-VALID")).toEqual({ page: "list" });
  expect(parseRoute("#/posts/%")).toEqual({ page: "list" });
});
