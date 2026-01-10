import { Badge } from '@fieldmcp/ui/components/badge';
import { Button } from '@fieldmcp/ui/components/button';
import { Card, CardContent } from '@fieldmcp/ui/components/card';
import {
  ArrowRightIcon,
  DatabaseIcon,
  LayersIcon,
  ShieldIcon,
  ZapIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Agricultural API Platform - Connect AI to Farm Data',
  description: site.description,
  openGraph: {
    title: site.title,
    description: `${site.tagline} Integrate with John Deere and Climate FieldView.`,
  },
});

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            Now supporting John Deere Operations Center
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Connect your AI to farm data{' '}
            <span className="text-primary">in minutes, not weeks</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {site.name} provides MCP servers for agricultural APIs. Integrate
            with John Deere, Climate FieldView, and more through a unified,
            LLM-ready interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start Building Free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs">Read the Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for AI-first agriculture
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate agricultural data into your AI
              applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <ZapIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">MCP Native</h3>
                <p className="text-sm text-muted-foreground">
                  Built on Model Context Protocol for seamless integration with
                  Claude, Cursor, and any MCP-compatible client.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <LayersIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Unified API</h3>
                <p className="text-sm text-muted-foreground">
                  One integration for all agricultural providers. John Deere
                  today, Climate FieldView and more coming soon.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ShieldIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Secure by Design</h3>
                <p className="text-sm text-muted-foreground">
                  OAuth flows handled for you. Tokens encrypted at rest. SOC 2
                  Type II certification in progress.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <DatabaseIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Complete Data</h3>
                <p className="text-sm text-muted-foreground">
                  Access field boundaries, machines, harvest data, planting
                  records, and more through structured tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get started in 3 simple steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Get your API key</h3>
              <p className="text-sm text-muted-foreground">
                Sign up and get an API key in seconds. Free tier includes 1,000
                requests per month.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect farmers</h3>
              <p className="text-sm text-muted-foreground">
                Use our OAuth flow to let farmers connect their John Deere
                Operations Center accounts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Query with AI</h3>
              <p className="text-sm text-muted-foreground">
                Use our MCP servers with Claude, Cursor, or any MCP-compatible
                client to access farm data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <ZapIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Create a free account and start accessing agricultural data in
            minutes. No credit card required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
