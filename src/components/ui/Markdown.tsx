import type { ReactNode } from 'react';

/**
 * Minimal, dependency-free, XSS-safe Markdown renderer for AI answers and forum
 * posts. Builds React nodes (never dangerouslySetInnerHTML). Supports: headings,
 * bullet lists, fenced code blocks, blank-line paragraphs, and inline **bold**,
 * `code`, [links](url). Unknown markup renders as plain text.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // tokenizer for **bold**, `code`, [text](url)
  const nodes: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2]) nodes.push(<strong key={`${keyPrefix}-b${i}`}>{m[2]}</strong>);
    else if (m[4]) nodes.push(<code key={`${keyPrefix}-c${i}`} className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.85em]">{m[4]}</code>);
    else if (m[6] && m[7]) nodes.push(<a key={`${keyPrefix}-l${i}`} href={m[7]} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-700 underline">{m[6]}</a>);
    last = re.lastIndex; i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ children, className = '' }: { children: string; className?: string }): JSX.Element {
  const lines = (children ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  let k = 0;

  const flushPara = (): void => {
    if (para.length) { blocks.push(<p key={`p${k++}`} className="leading-relaxed">{renderInline(para.join(' '), `p${k}`)}</p>); para = []; }
  };
  const flushList = (): void => {
    if (list.length) {
      blocks.push(<ul key={`u${k++}`} className="list-disc space-y-1 pl-5">{list.map((li, j) => <li key={j}>{renderInline(li, `u${k}-${j}`)}</li>)}</ul>);
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (line.trim().startsWith('```')) {
      if (code === null) { flushPara(); flushList(); code = []; }
      else { blocks.push(<pre key={`pre${k++}`} className="overflow-x-auto rounded-xl bg-neutral-900 p-3 text-caption text-neutral-100"><code>{code.join('\n')}</code></pre>); code = null; }
      continue;
    }
    if (code !== null) { code.push(line); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushPara(); flushList(); const lvl = h[1].length; blocks.push(<p key={`h${k++}`} className={`font-heading ${lvl === 1 ? 'text-h2' : 'text-h3'} mt-1`}>{renderInline(h[2], `h${k}`)}</p>); continue; }
    if (/^\s*[-*]\s+/.test(line)) { flushPara(); list.push(line.replace(/^\s*[-*]\s+/, '')); continue; }
    if (line.trim() === '') { flushPara(); flushList(); continue; }
    para.push(line.trim());
  }
  flushPara(); flushList();
  if (code !== null && code.length) blocks.push(<pre key={`pre${k++}`} className="overflow-x-auto rounded-xl bg-neutral-900 p-3 text-caption text-neutral-100"><code>{code.join('\n')}</code></pre>);

  return <div className={`space-y-3 text-body text-neutral-800 ${className}`}>{blocks}</div>;
}
