import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useCallback, useState } from "react";
import { C, font } from "@/lib/adminTheme";

const TOOLBAR_BTN_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 30,
  minWidth: 30,
  padding: "0 8px",
  borderRadius: 5,
  border: "none",
  background: "transparent",
  color: C.textMuted,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  transition: "color 0.1s, background 0.1s",
  whiteSpace: "nowrap" as const,
};

const ACTIVE_STYLE: React.CSSProperties = {
  background: C.accentDim,
  color: C.accent,
};

function ToolBtn({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        ...TOOLBAR_BTN_BASE,
        ...(active ? ACTIVE_STYLE : {}),
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLButtonElement).style.color = C.text;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
        }
      }}
    >
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px", flexShrink: 0 }} />
  );
}

const EDITOR_CSS = `
.tiptap-admin .ProseMirror {
  outline: none;
  min-height: 280px;
  padding: 16px;
  color: #E8ECF1;
  font-family: ${font};
  font-size: 14px;
  line-height: 1.75;
  caret-color: #08F295;
}
.tiptap-admin .ProseMirror p { margin: 0 0 10px; }
.tiptap-admin .ProseMirror p:last-child { margin-bottom: 0; }
.tiptap-admin .ProseMirror h1 { font-size: 24px; font-weight: 700; color: #E8ECF1; margin: 20px 0 10px; }
.tiptap-admin .ProseMirror h2 { font-size: 20px; font-weight: 700; color: #E8ECF1; margin: 18px 0 8px; }
.tiptap-admin .ProseMirror h3 { font-size: 17px; font-weight: 600; color: #E8ECF1; margin: 14px 0 6px; }
.tiptap-admin .ProseMirror strong { color: #ffffff; font-weight: 700; }
.tiptap-admin .ProseMirror em { font-style: italic; color: #c8cfe0; }
.tiptap-admin .ProseMirror a { color: #08F295; text-decoration: underline; cursor: pointer; }
.tiptap-admin .ProseMirror ul, .tiptap-admin .ProseMirror ol { padding-left: 22px; margin: 8px 0 10px; }
.tiptap-admin .ProseMirror li { margin-bottom: 4px; }
.tiptap-admin .ProseMirror blockquote { border-left: 3px solid #08F295; margin: 12px 0; padding: 8px 14px; color: #7A8599; font-style: italic; }
.tiptap-admin .ProseMirror code { font-family: monospace; background: rgba(8,242,149,0.08); color: #08F295; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
.tiptap-admin .ProseMirror pre { background: #0B0E11; border: 1px solid #1E2530; border-radius: 7px; padding: 14px 16px; overflow-x: auto; margin: 12px 0; }
.tiptap-admin .ProseMirror pre code { background: none; padding: 0; color: #E8ECF1; }
.tiptap-admin .ProseMirror hr { border: none; border-top: 1px solid #1E2530; margin: 20px 0; }
.tiptap-admin .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #4A5568;
  pointer-events: none;
  float: left;
  height: 0;
}
`;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write your content here..." }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: { HTMLAttributes: { class: "code-block" } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current !== incoming && incoming !== current.replace(/<p><\/p>$/, "")) {
      editor.commands.setContent(incoming, false);
    }
  }, [value, editor]);

  const applyLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  if (!editor) return null;

  const isLinkActive = editor.isActive("link");

  return (
    <>
      <style>{EDITOR_CSS}</style>
      <div
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          background: C.surface,
          overflow: "hidden",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = C.accent;
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
          }
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "6px 10px",
            borderBottom: `1px solid ${C.border}`,
            background: C.bg,
            flexWrap: "wrap",
          }}
        >
          <ToolBtn label="H2" title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolBtn label="H3" title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <Divider />
          <ToolBtn label="B" title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolBtn label="I" title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <Divider />
          <ToolBtn label="• List" title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolBtn label="1. List" title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <Divider />
          <ToolBtn label="❝" title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <ToolBtn label="Code" title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />
          <Divider />
          <ToolBtn
            label={isLinkActive ? "Unlink" : "Link"}
            title={isLinkActive ? "Remove link" : "Insert link"}
            active={isLinkActive}
            onClick={() => {
              if (isLinkActive) {
                removeLink();
              } else {
                setShowLinkInput((v) => !v);
              }
            }}
          />
          <Divider />
          <ToolBtn label="—" title="Horizontal rule" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
          <ToolBtn label="Clear" title="Clear formatting" active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} />
        </div>

        {/* Link input */}
        {showLinkInput && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderBottom: `1px solid ${C.border}`,
              background: C.bg,
            }}
          >
            <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>URL:</span>
            <input
              autoFocus
              type="text"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 5,
                border: `1px solid ${C.borderLight}`,
                background: C.surface,
                color: C.text,
                fontSize: 13,
                fontFamily: font,
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = C.accent; }}
              onBlur={(e) => { e.target.style.borderColor = C.borderLight; }}
            />
            <button
              type="button"
              onClick={applyLink}
              style={{
                padding: "6px 14px",
                borderRadius: 5,
                border: "none",
                background: C.accent,
                color: C.bg,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              style={{
                padding: "6px 12px",
                borderRadius: 5,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.textMuted,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Editor area */}
        <div className="tiptap-admin">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}
