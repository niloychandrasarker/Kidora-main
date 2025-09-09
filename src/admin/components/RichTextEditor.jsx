import React, { useRef } from 'react';

export default function RichTextEditor({ value, onChange, placeholder = "Write description in Markdown..." }) {
  const textareaRef = useRef(null);

  const applyWrap = (prefix, suffix = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || 'text';
    const after = value.slice(end);
    const next = `${before}${prefix}${selected}${suffix}${after}`;
    onChange({ target: { name: 'description', value: next } });
    setTimeout(() => {
      const pos = start + prefix.length;
      el.focus();
      el.setSelectionRange(pos, pos + selected.length);
    }, 0);
  };

  const insertAtLineStart = (marker) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const before = value.slice(0, start);
    const lastNl = before.lastIndexOf('\n');
    const lineStart = lastNl === -1 ? 0 : lastNl + 1;
    const next = `${value.slice(0, lineStart)}${marker} ${value.slice(lineStart)}`;
    onChange({ target: { name: 'description', value: next } });
    setTimeout(() => {
      const pos = lineStart + marker.length + 1;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const toggleBulletedSelection = (marker = '- ') => {
    const el = textareaRef.current;
    if (!el) return;
    const selStart = el.selectionStart ?? 0;
    const selEnd = el.selectionEnd ?? 0;
    const text = value;

    const before = text.slice(0, selStart);
    const lineStart = before.lastIndexOf('\n') + 1; // 0 if none found
    const afterFromEnd = text.slice(selEnd);
    const nextNewline = afterFromEnd.indexOf('\n');
    const lineEnd = selEnd + (nextNewline === -1 ? afterFromEnd.length : nextNewline);

    const block = text.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const bulletRe = /^\s*([-*+]|•)\s+/;
    const allBulleted = lines.every((l) => l.trim() === '' || bulletRe.test(l));

    const newLines = lines.map((l) => {
      if (l.trim() === '') return l;
      if (allBulleted) {
        return l.replace(bulletRe, '');
      }
      return `${marker}${l.replace(/^\s*/, '')}`;
    });

    const newBlock = newLines.join('\n');
    const next = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);
    onChange({ target: { name: 'description', value: next } });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + newBlock.length);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end) return; // simple case: don't auto-continue across selection

    const before = value.slice(0, start);
    const after = value.slice(end);
    const lastNl = before.lastIndexOf('\n');
    const lineStart = lastNl === -1 ? 0 : lastNl + 1;
    const line = before.slice(lineStart);
    const m = line.match(/^(\s*)(([-*+]|•|\d+\.|\d+\))\s+)/);
    if (!m) return; // not a list line

    e.preventDefault();
    const indent = m[1] || '';
    const bullet = m[2] || '- ';
    const content = line.slice(m[0].length);
    const insert = content.trim().length === 0 ? '\n' : `\n${indent}${bullet}`;
    const next = before + insert + after;
    onChange({ target: { name: 'description', value: next } });
    setTimeout(() => {
      const pos = start + insert.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => applyWrap('**')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Bold</button>
        <button type="button" onClick={() => applyWrap('*')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Italic</button>
        <button type="button" onClick={() => insertAtLineStart('#')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">H1</button>
        <button type="button" onClick={() => insertAtLineStart('##')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">H2</button>
        <button type="button" onClick={() => insertAtLineStart('-')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Bullet -</button>
        <button type="button" onClick={() => insertAtLineStart('•')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Bullet •</button>
        <button type="button" onClick={() => toggleBulletedSelection('- ')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Toggle List</button>
        <button type="button" onClick={() => applyWrap('[', '](https://)')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Link</button>
      </div>
      <textarea
        ref={textareaRef}
        name="description"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={6}
        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-500 mt-1">Supports Markdown: bold, italic, headings, bullet lists, links.</p>
    </div>
  );
}
