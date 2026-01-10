import { Badge } from '@fieldmcp/ui/components/badge';
import { Button } from '@fieldmcp/ui/components/button';
import { Card, CardContent } from '@fieldmcp/ui/components/card';
import { ArrowLeftIcon, ConstructionIcon } from 'lucide-react';
import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  description: string;
  badge?: string;
}

export function PlaceholderPage({
  title,
  description,
  badge = 'Coming Soon',
}: PlaceholderPageProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center">
            <ConstructionIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <Badge variant="secondary" className="mb-4">
              {badge}
            </Badge>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {description}
            </p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
