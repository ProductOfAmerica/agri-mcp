import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@agrimcp/ui/components/alert';
import { Badge } from '@agrimcp/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@agrimcp/ui/components/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@agrimcp/ui/components/table';
import { LinkIcon } from 'lucide-react';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/skeletons';
import { getConnections } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { ConnectJohnDeereButton } from './connect-john-deere-button';
import { DisconnectButton } from './disconnect-button';

async function ConnectionsTable({ userId }: { userId: string }) {
  const connections = await getConnections(userId);

  if (!connections || connections.length === 0) {
    return (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LinkIcon />
          </EmptyMedia>
          <EmptyTitle>No farmer connections yet</EmptyTitle>
          <EmptyDescription>
            Connect a farmer's account to start accessing their data.
          </EmptyDescription>
        </EmptyHeader>
        <ConnectJohnDeereButton />
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Farmer ID</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Connected</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {connections.map((conn) => {
          const isExpired =
            conn.token_expires_at &&
            new Date(conn.token_expires_at) < new Date();
          return (
            <TableRow key={conn.id}>
              <TableCell className="font-mono">
                {conn.farmer_identifier}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {conn.provider === 'john_deere'
                    ? 'John Deere'
                    : conn.provider}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(conn.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {isExpired ? (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-300"
                  >
                    Token expired
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-300"
                  >
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DisconnectButton
                  connectionId={conn.id}
                  farmerId={conn.farmer_identifier}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Farmer Connections
          </h1>
          <p className="text-muted-foreground">
            Manage OAuth connections to farmer accounts.
          </p>
        </div>
        <ConnectJohnDeereButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Farmers</CardTitle>
          <CardDescription>
            These farmers have authorized access to their John Deere data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton columns={5} />}>
            <ConnectionsTable userId={user!.id} />
          </Suspense>
        </CardContent>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <LinkIcon className="size-4 text-blue-600" />
        <AlertTitle className="text-blue-800">
          Programmatic Connections
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          <p className="mb-2">
            You can also connect farmers programmatically by redirecting them
            to:
          </p>
          <code className="block rounded bg-blue-100 px-3 py-2 text-sm">
            GET /api/oauth/john-deere/authorize?farmer_id=YOUR_FARMER_ID
          </code>
          <p className="mt-2">
            The farmer will authorize access to their John Deere account and be
            redirected back to your application.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
