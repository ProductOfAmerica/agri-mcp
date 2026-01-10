import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLegalDocument } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy | FieldMCP',
  description: 'Privacy Policy for the FieldMCP platform',
};

export default async function PrivacyPage() {
  const content = await getLegalDocument('privacy-policy.md');

  return (
    <article className="prose prose-slate dark:prose-invert max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
