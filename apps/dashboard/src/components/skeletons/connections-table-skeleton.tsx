import { Skeleton } from '@fieldmcp/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fieldmcp/ui/components/table';

interface ConnectionsTableSkeletonProps {
  rows?: number;
}

export function ConnectionsTableSkeleton({
  rows = 3,
}: ConnectionsTableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-14" />
          </TableHead>
          <TableHead className="text-right">
            <Skeleton className="ml-auto h-4 w-16" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={`row-${i.toString()}`}>
            {/* Farmer ID column - monospace */}
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            {/* Provider column - Badge */}
            <TableCell>
              <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>
            {/* Connected column */}
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            {/* Status column - Badge */}
            <TableCell>
              <Skeleton className="h-5 w-14 rounded-full" />
            </TableCell>
            {/* Actions column - right aligned button */}
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-8 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
