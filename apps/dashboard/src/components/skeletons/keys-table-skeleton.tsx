import { Skeleton } from '@fieldmcp/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fieldmcp/ui/components/table';

interface KeysTableSkeletonProps {
  rows?: number;
}

export function KeysTableSkeleton({ rows = 3 }: KeysTableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Skeleton className="h-4 w-12" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-8" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead className="text-right">
            <Skeleton className="ml-auto h-4 w-16" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={`row-${i.toString()}`}>
            {/* Name column */}
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            {/* Key column - monospace code block */}
            <TableCell>
              <Skeleton className="h-6 w-32 rounded bg-muted" />
            </TableCell>
            {/* Created column */}
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            {/* Last Used column - can be date or Badge */}
            <TableCell>
              <Skeleton className="h-5 w-14 rounded-full" />
            </TableCell>
            {/* Actions column - right aligned button */}
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-8 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
