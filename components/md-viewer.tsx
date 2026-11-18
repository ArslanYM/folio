"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { isValidHex, normalizeHex } from "@/lib/color";
import { slugifyHeading } from "@/lib/slug";
import { cn } from "@/lib/utils";

const HEX_IN_TEXT_RE = /(#[0-9a-fA-F]{3,8}\b)/g;

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }
  return "";
}

function HexChip({ rawHex }: { rawHex: string }) {
  const normalized = normalizeHex(rawHex);
  if (!normalized) return <>{rawHex}</>;
  const display = normalized.toUpperCase();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(display);
      toast.success(`Copied ${display}`);
    } catch {
      toast.error(`Could not copy ${display}`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${display}`}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border bg-canvas px-1.5 py-0.5 align-baseline font-mono text-[12px] text-foreground transition-colors hover:border-accent/70 hover:text-accent"
    >
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: normalized }}
      />
      <span>{rawHex}</span>
    </button>
  );
}

function decorateHexText(text: string): ReactNode {
  const parts = text.split(HEX_IN_TEXT_RE);
  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    if (part.startsWith("#") && isValidHex(part)) {
      return <HexChip key={`${part}-${idx}`} rawHex={part} />;
    }
    return part;
  });
}

function decorateChildrenWithHex(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return decorateHexText(child);
    }
    return child;
  });
}

function ShikiCodeBlock({
  code,
  language,
  isStreaming,
}: {
  code: string;
  language: string;
  isStreaming: boolean;
}) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  // Extract unique valid hexes inside code block for quick click-to-copy dots
  const hexesInCode = useMemo(() => {
    const matches = code.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const m of matches) {
      if (!isValidHex(m)) continue;
      const norm = normalizeHex(m);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        list.push(norm);
      }
    }
    return list.slice(0, 12);
  }, [code]);

  useEffect(() => {
    if (isStreaming) return;
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const safeLang =
          /^(css|html|json|ts|tsx|js|jsx|bash|sh|md|markdown|yaml|swift|kotlin)$/i.test(
            language
          )
            ? language.toLowerCase()
            : "text";

        const html = await codeToHtml(code, {
          lang: safeLang,
          theme: "vitesse-dark",
        });

        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch {
        // Fallback to plain <pre><code>
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language, isStreaming]);

  return (
    <div className="my-4 overflow-hidden rounded-md border border-border bg-canvas">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-surface px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {language || "code"}
        </span>
        {hexesInCode.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {hexesInCode.map((hex) => (
              <HexChip key={hex} rawHex={hex} />
            ))}
          </div>
        )}
      </div>

      {highlightedHtml ? (
        <div
          className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-foreground/90">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

export interface MdViewerProps {
  markdown: string;
  isStreaming?: boolean;
  className?: string;
}

export function MdViewer({
  markdown,
  isStreaming = false,
  className,
}: MdViewerProps) {
  return (
    <div
      className={cn(
        "md-viewer text-sm leading-relaxed text-foreground/90",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-2 border-b border-border pb-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = extractTextContent(children);
            const id = slugifyHeading(text);
            return (
              <h2
                id={id}
                className="mb-3 mt-8 scroll-mt-20 border-b border-border/70 pb-2 font-display text-xl font-semibold tracking-tight text-foreground"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 font-display text-base font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3 leading-relaxed text-foreground/85">
              {decorateChildrenWithHex(children)}
            </p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-accent/70 bg-canvas/60 px-4 py-2.5 text-sm italic text-foreground/85">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1.5 pl-5 text-foreground/85">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1.5 pl-5 text-foreground/85">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {decorateChildrenWithHex(children)}
            </li>
          ),
          hr: () => <hr className="my-6 border-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border bg-canvas/90 font-mono uppercase tracking-wider text-muted-foreground">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/60 bg-surface/50">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top text-foreground/90">
              {decorateChildrenWithHex(children)}
            </td>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className: codeClassName, children }) => {
            const rawText = extractTextContent(children).replace(/\n$/, "");
            const langMatch = /language-([a-zA-Z0-9_-]+)/.exec(
              codeClassName ?? ""
            );
            const isBlock = Boolean(langMatch) || rawText.includes("\n");

            if (isBlock) {
              return (
                <ShikiCodeBlock
                  code={rawText}
                  language={langMatch?.[1] ?? "text"}
                  isStreaming={isStreaming}
                />
              );
            }

            if (rawText.startsWith("#") && isValidHex(rawText)) {
              return <HexChip rawHex={rawText} />;
            }

            return (
              <code className="rounded border border-border/80 bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                {rawText}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>

      {isStreaming && (
        <span
          aria-label="Streaming output"
          className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-accent motion-safe:animate-pulse"
        />
      )}
    </div>
  );
}
