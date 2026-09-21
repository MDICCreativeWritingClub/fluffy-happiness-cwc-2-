"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { colors } from "@/lib/theme";
import { applyFormatMark, type FormatMark } from "@/lib/richText";

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}

export function FormattingToolbar({ textareaRef, onChange }: FormattingToolbarProps) {
  function handleMark(mark: FormatMark) {
    const el = textareaRef.current;
    if (!el) return;

    const { value, selectionStart, selectionEnd } = applyFormatMark(el, mark);
    onChange(value);

    // Restore focus + selection after React re-renders with the new value
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  const buttonStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    borderRadius: "0.5rem",
    border: `1px solid ${colors.gray200}`,
    backgroundColor: colors.surface,
    color: colors.gray700,
  };

  return (
    <div className="flex gap-1.5 mb-2">
      <button
        type="button"
        onClick={() => handleMark("bold")}
        style={buttonStyle}
        className="hover:opacity-80 transition-opacity"
        title="Bold"
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        onClick={() => handleMark("italic")}
        style={buttonStyle}
        className="hover:opacity-80 transition-opacity"
        title="Italic"
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        onClick={() => handleMark("underline")}
        style={buttonStyle}
        className="hover:opacity-80 transition-opacity"
        title="Underline"
      >
        <Underline size={14} />
      </button>
    </div>
  );
}
