import { describe, it, expect } from "vitest";
import { unwrapAll } from "@/utils";
import { createSpan, createToken, scanSource } from "@/tokenizer";

describe("tokenizer", () => {
  it("should return EOF token for empty source code", () => {
    const tokens = unwrapAll(scanSource(""));

    expect(tokens).toHaveLength(1);
    expect(tokens).toEqual([createToken("EOF", createSpan("", 0, 0))]);
  });

  it("should tokenize whitespace", () => {
    const tokens = unwrapAll(scanSource("   \n\t  "));

    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual([
      createToken("Whitespace", createSpan("   \n\t  ", 0, 7)),
      createToken("EOF", createSpan("", 7, 7)),
    ]);
  });

  it("should tokenize an empty self-closing tag", () => {
    const tokens = unwrapAll(scanSource("<Page/>"));

    expect(tokens).toEqual([
      createToken("LessThan", createSpan("<", 0, 1)),
      createToken("TagName", createSpan("Page", 1, 5)),
      createToken("Slash", createSpan("/", 5, 6)),
      createToken("GreaterThan", createSpan(">", 6, 7)),
      createToken("EOF", createSpan("", 7, 7)),
    ]);
  });

  it("should tokenize closing tag", () => {
    const tokens = unwrapAll(scanSource("</Page>"));

    expect(tokens).toEqual([
      createToken("LessThan", createSpan("<", 0, 1)),
      createToken("Slash", createSpan("/", 1, 2)),
      createToken("TagName", createSpan("Page", 2, 6)),
      createToken("GreaterThan", createSpan(">", 6, 7)),
      createToken("EOF", createSpan("", 7, 7)),
    ]);
  });

  it("should tokenize shorthand closing tag", () => {
    const tokens = unwrapAll(scanSource("</>"));

    expect(tokens).toEqual([
      createToken("LessThan", createSpan("<", 0, 1)),
      createToken("Slash", createSpan("/", 1, 2)),
      createToken("GreaterThan", createSpan(">", 2, 3)),
      createToken("EOF", createSpan("", 3, 3)),
    ]);
  });

  it("should tokenize inner text", () => {
    expect(unwrapAll(scanSource("<Page>Hello, world!</>"))).toMatchSnapshot();
  });

  it("should tokenize attributes", () => {
    expect(
      unwrapAll(
        scanSource('<Button name="btnSubmit" class="btn-primary btn-wide" />')
      )
    ).toMatchSnapshot();
  });

  it("should tokenize boolean attribute without value", () => {
    expect(unwrapAll(scanSource("<TextField disabled />"))).toMatchSnapshot();
  });

  it.each([true, false, 42, 123.456, '"Hello world"'])(
    "should tokenize interpolation with %s value",
    (value: string | number | boolean) => {
      expect(
        unwrapAll(scanSource(`<SomeTag value=${value} />`))
      ).toMatchSnapshot();
    }
  );

  it("should tokenize nested tags", () => {
    const source = `
      <Modal title="Greeting">
        <.header>Welcome</>
        <.content>
          <Label>Enter your name:</>
          <TextField name="txtName" maxLength=100 />
          <Button name="btnSubmit" disabled>Submit</>
        </>
      </>
    `;

    expect(unwrapAll(scanSource(source))).toMatchSnapshot();
  });

  it("should tokenize annotations", () => {
    const source = `
      <cmp:Modal bind:title="Greeting"/>
    `;

    expect(unwrapAll(scanSource(source))).toEqual([
      createToken("LessThan", createSpan("<", 7, 8)),
      createToken("TagName", createSpan("cmp:Modal", 8, 16)),
      createToken("Whitespace", createSpan(" ", 16, 17)),
      createToken("AttributeName", createSpan("bind:title", 17, 28)),
      createToken("Equal", createSpan("=", 28, 29)),
      createToken("StringLiteral", createSpan('"Greeting"', 29, 39)),
      createToken("Slash", createSpan("/", 39, 40)),
      createToken("GreaterThan", createSpan(">", 40, 41)),
      createToken("EOF", createSpan("", 45, 45)),
    ]);
  });
});
