import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  children: string;
}

export function MarkdownContent({ children }: MarkdownContentProps) {
  return (
    <div className="text-foreground">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <h1 className="serif mt-8 mb-3 text-3xl tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="serif mt-7 mb-2 text-xl tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 text-base font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-foreground/85 mb-3 text-[14px] leading-[1.7]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="text-foreground/85 mb-3 list-disc pl-5 text-[14px] leading-[1.7]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-foreground/85 mb-3 list-decimal pl-5 text-[14px] leading-[1.7]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return <code className={className}>{children}</code>;
            }
            return (
              <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[12.5px]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted border-border my-4 overflow-x-auto rounded-md border p-3 font-mono text-[12.5px] leading-[1.55]">
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary underline-offset-2 hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="border-border my-6" />,
          blockquote: ({ children }) => (
            <blockquote className="border-primary/40 text-muted-foreground my-4 border-l-2 pl-4 text-[13.5px] italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="border-border w-full border-collapse border text-[13px]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-muted border-border border px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-border border px-3 py-2">{children}</td>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
