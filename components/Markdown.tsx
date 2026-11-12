"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { defaultUrlTransform } from "react-markdown";

// [[Doc Title]] → wikilink:Doc%20Title before parsing
function encodeWikilinks(content: string): string {
  return content.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_m, title, alias) => {
    const label = alias || title;
    return `[${label}](wikilink:${encodeURIComponent(title.trim())})`;
  });
}

// let the wikilink: pseudo-protocol through react-markdown's URL sanitizer
function urlTransform(uri: string): string {
  if (uri.startsWith("wikilink:")) return uri;
  return defaultUrlTransform(uri);
}

export default function Markdown({
  content,
  resolveWikilink,
}: {
  content: string;
  resolveWikilink?: (title: string) => string;
}) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        urlTransform={urlTransform}
        components={{
          a: ({ href, children }) => {
            if (href && href.startsWith("wikilink:")) {
              const title = decodeURIComponent(href.slice("wikilink:".length));
              const target = resolveWikilink ? resolveWikilink(title) : "";
              if (!target) {
                return <span className="wikilink-broken" title={`No doc named "${title}" in this vault`}>[[{title}]]</span>;
              }
              return (
                <a className="wikilink" href={target} title={title}>
                  {children}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {encodeWikilinks(content)}
      </ReactMarkdown>
    </div>
  );
}
