import { describe, it, expect } from "vitest";
import { unwrapAll } from "@/utils";
import { scan } from "@/tokenizer";

describe("tokenizer", () => {
  describe("document", () => {
    it("should tokenize an empty source code", () => {
      expect(unwrapAll(scan(""))).toMatchSnapshot();
    });

    it("should tokenize leading whitespace", () => {
      expect(unwrapAll(scan("   \n\t  "))).toMatchSnapshot();
    });

    it("should tokenize root-level comment", () => {
      expect(unwrapAll(scan("# Root level comment"))).toMatchSnapshot();
    });

    it("should throw error on root-level text", () => {
      expect(() => unwrapAll(scan("Some root level text"))).toThrowError(
        "Unexpected character 'S' (1, 1)"
      );
    });
  });

  describe("tags", () => {
    it("should tokenize an empty self-closing tag", () => {
      expect(unwrapAll(scan("<Pipeline/>"))).toMatchSnapshot();
    });

    it("should tokenize closing tag", () => {
      expect(unwrapAll(scan("</Pipeline>"))).toMatchSnapshot();
    });

    it("should tokenize shorthand closing tag", () => {
      expect(unwrapAll(scan("</>"))).toMatchSnapshot();
    });

    it("should throw error when there are more than one root tags", () => {
      expect(unwrapAll(scan("<A></A><B></B>"))).toMatchSnapshot();
    });

    it("should tokenize comments inside tags", () => {
      expect(
        unwrapAll(
          scan(`
            <A>
                <B></B> # Comment inside tag
            </A>
          `)
        )
      ).toMatchSnapshot();
    });

    it("should return error when tag name is missing", () => {
      expect(unwrapAll(scan("< />"))).toMatchSnapshot();
    });

    it("should return error when tag is not closed", () => {
      expect(() =>
        unwrapAll(scan('<Pipeline name="SomePipeline"'))
      ).toThrowError("Expected '>' at the end of the tag (1, 30)");
    });
  });

  describe("comments", () => {
    it("should tokenize comments with special characters", () => {
      const source = `# Config: <Pipeline title="User Pipeline" version="2.0" />`;
      expect(unwrapAll(scan(source))).toMatchSnapshot();
    });
  });

  describe("text", () => {
    it("should tokenize inner text", () => {
      expect(
        unwrapAll(scan("<Title>Welcome to Starbound Odyssey</Title>"))
      ).toMatchSnapshot();
    });
  });

  describe("attributes", () => {
    it("should tokenize attributes", () => {
      expect(
        unwrapAll(scan('<Scene name="MainMenu" version="2.1.0" />'))
      ).toMatchSnapshot();
    });

    it.each([true, false, 42, 123.456, -273.15])(
      "should tokenize primitive attribute (%s)",
      (value: string | number | boolean) => {
        expect(unwrapAll(scan(`<Column value=${value} />`))).toMatchSnapshot();
      }
    );

    it("should tokenize number starting with .25", () => {
      expect(unwrapAll(scan(`<Column value=.25 />`))).toMatchSnapshot();
    });

    it("should tokenize boolean attribute without value", () => {
      expect(
        unwrapAll(scan('<Rule field="email" type="email" required />'))
      ).toMatchSnapshot();
    });

    it.each([
      'Some \\"title\\"', // Escaped quotes
      "Some \\ntitle", // Escaped newline
      "Some title\\\\", // Escaped backslash at end
      "Some\\ttitle", // Escaped tab
      "Some\\rtitle", // Escaped carriage return
      "test\\\\more", // Escaped backslash in middle
      '\\"start', // Escaped quote at start
      'end\\"', // Escaped quote at end
      "\\\\\\\\", // Multiple escaped backslashes
      'mix\\"test\\nmore\\\\end', // Multiple different escapes
      "single\\\\", // Single backslash (incomplete escape)
    ])(
      "should tokenize string attribute with escape characters (%s)",
      (title) => {
        expect(unwrapAll(scan(`<Scene title="${title}" />`))).toMatchSnapshot();
      }
    );
  });

  describe("annotations", () => {
    it("should tokenize annotations", () => {
      const source = '<cfg:Pipeline bind:title="User Pipeline" />';

      expect(unwrapAll(scan(source))).toMatchSnapshot();
    });
  });

  describe("edge cases", () => {
    describe("document structure", () => {
      describe("escape sequences at boundaries", () => {
        it("should handle backslash before closing quote", () => {
          // Testing: "test\\" - backslash at end, properly escaped
          const source = '<Tag value="test\\\\" />';
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });

        it("should handle string ending with escaped quote", () => {
          const source = '<Tag value="say \\"hello\\"" />';
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });

        it("should error on unterminated string with trailing backslash", () => {
          // This is malformed: "test\ (no closing quote)
          const source = '<Tag value="test\\';
          expect(() => unwrapAll(scan(source))).toThrowError();
        });

        it("should error on unterminated string", () => {
          const source = '<Tag value="test';
          expect(() => unwrapAll(scan(source))).toThrowError(
            "Unterminated string literal"
          );
        });
      });

      describe("number edge cases", () => {
        it("should handle just negative sign (not a number)", () => {
          // "-" alone should not be treated as a number
          const source = "<Tag value=- />";
          expect(() => unwrapAll(scan(source))).toThrowError();
        });

        it("should handle just decimal point (not a number)", () => {
          const source = "<Tag value=. />";
          expect(() => unwrapAll(scan(source))).toThrowError();
        });

        it("should tokenize negative decimal number", () => {
          const source = "<Tag value=-.5 />";
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });

        it("should tokenize zero", () => {
          const source = "<Tag value=0 />";
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });

        it("should tokenize negative zero", () => {
          const source = "<Tag value=-0 />";
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });
      });

      describe("empty content", () => {
        it("should handle tag with only whitespace children", () => {
          const source = "<P>   \n\t  </P>";
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });

        it("should handle empty tag pair", () => {
          const source = "<P></P>";
          expect(unwrapAll(scan(source))).toMatchSnapshot();
        });
      });
    });
  });

  it("should tokenize nested tags", () => {
    const source = `
      # Customer data pipeline
      <Pipeline name="CustomerDataSync">
        <.Sources>
          <Database                   # Source database
            name       = "production" # Primary production database
            connection = "postgres://prod-db:5432/main"
            schema     = "public" />
          </>
        </>
      </>
    `;

    expect(unwrapAll(scan(source))).toMatchSnapshot();
  });
});
