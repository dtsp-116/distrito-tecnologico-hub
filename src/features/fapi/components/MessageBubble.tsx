"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <article
      className={`max-w-[92%] rounded-md p-3 text-sm shadow-sm sm:max-w-[85%] ${
        isUser
          ? "ml-auto bg-district-red text-white"
          : "mr-auto border border-district-border bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      }`}
    >
      {isUser ? (
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h4 className="mb-2 mt-1 text-sm font-bold">{children}</h4>,
            h2: ({ children }) => <h4 className="mb-2 mt-1 text-sm font-semibold">{children}</h4>,
            p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </article>
  );
}
