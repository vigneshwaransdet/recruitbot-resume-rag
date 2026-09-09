/**
 * Text normalization utilities (Phase 6).
 *
 * Goal: normalize extracted resume text before parsing/embedding while
 * preserving meaningful content.
 *
 * Behavior:
 * - Normalize CRLF / CR to LF line breaks.
 * - Remove control characters (except newline and tab).
 * - Collapse runs of spaces/tabs into a single space.
 * - Trim leading/trailing whitespace on each line.
 * - Remove duplicate blank lines (collapse consecutive newlines) and
 *   remove leading/trailing blank lines overall.
 *
 * Non-destructive: keeps technical tokens (C#, C++, .NET), emails,
 * dates, job titles and other meaningful symbols intact.
 */
export function cleanText(rawText: string): string {
  if (typeof rawText !== "string") {
    return "";
  }

  let text = rawText;

  // 1) Normalize line breaks to LF.
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2) Remove control characters except newline (\n = 0x0A) and tab (\t = 0x09).
  //    This strips things like NUL, form-feed, vertical-tab, etc.
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3) Collapse runs of spaces/tabs (but not newlines) into one space.
  text = text.replace(/[ \t]+/g, " ");

  // 4) Trim spaces around each line.
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // 5) Remove duplicate blank lines: collapse any run of 2+ newlines
  //    (i.e. one or more blank lines) into a single line break so
  //    content lines stay adjacent.
  text = text.replace(/\n{2,}/g, "\n");

  // 6) Trim leading/trailing whitespace and blank lines overall.
  text = text.trim();

  return text;
}
