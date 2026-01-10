import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLegalDocument } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service | FieldMCP',
  description: 'Terms of Service for the FieldMCP platform',
};

export default async function TermsPage() {
  const content = await getLegalDocument('terms-of-service.md');

  return (
    <article className="prose prose-slate dark:prose-invert max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
