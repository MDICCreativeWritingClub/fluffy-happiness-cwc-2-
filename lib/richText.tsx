import type { ReactNode } from "react";

export type FormatMark = "bold" | "italic" | "underline";

const MARKERS: Record<FormatMark, string> = {
  bold: "**",
  italic: "*",
  underline: "__",
};

/**
 * Wraps the currently selected text in a textarea with the given
 * marker (e.g. **bold**). If nothing is selected, inserts an empty
 * pair of markers with the cursor placed between them.
 * Returns the new full text value and where the cursor should end up.
 */
export function applyFormatMark(
  textarea: HTMLTextAreaElement,
  mark: FormatMark
): { value: string; selectionStart: number; selectionEnd: number } {
  const marker = MARKERS[mark];
  const { value, selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);

  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const wrapped = `${marker}${selected}${marker}`;
  const newValue = `${before}${wrapped}${after}`;

  const newStart = selectionStart + marker.length;
  const newEnd = newStart + selected.length;

  return { value: newValue, selectionStart: newStart, selectionEnd: newEnd };
}

/**
 * Strips **bold**, *italic*, and __underline__ markers, leaving
 * plain text. Used for contexts that show raw text only (card
 * excerpts, previews) rather than rendering formatting.
 */
export function stripFormatMarks(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

/**
 * Parses **bold**, *italic*, and __underline__ markers in a plain
 * string into React nodes. Order matters: bold (double asterisk) is
 * matched before italic (single asterisk) so **text** isn't
 * misread as two italic markers.
 */
export function renderFormattedText(text: string): ReactNode[] {
  const pattern = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    // Recurse into the matched content so a bold span can itself
    // contain italic/underline (or any combination) and have both
    // styles apply, instead of only the outermost marker winning.
    if (match[1]) {
      nodes.push(<strong key={key++}>{renderFormattedText(match[2])}</strong>);
    } else if (match[3]) {
      nodes.push(<u key={key++}>{renderFormattedText(match[4])}</u>);
    } else if (match[5]) {
      nodes.push(<em key={key++}>{renderFormattedText(match[6])}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
