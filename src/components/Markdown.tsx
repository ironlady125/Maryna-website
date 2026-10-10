import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Renders owner-authored Markdown (from the admin panel). */
export function Markdown({ text, className = "prose-mm" }: { text: string; className?: string }) {
  const html = marked.parse(text || "", { async: false }) as string;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html.replace(/<script[\s\S]*?<\/script>/gi, "") }} />;
}
