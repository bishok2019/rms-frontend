import { useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TableRecord {
  id: string;
  tableCode: string;
  area: string;
  capacity: number;
  canTakeMultipleOrder: boolean;
  remarks?: string;
  qrCode?: string;
}

interface TablesDataTableProps {
  data: TableRecord[];
  onEdit: (table: TableRecord) => void;
  onDelete: (id: string) => void;
}

export function TablesDataTable({
  data,
  onEdit,
  onDelete,
}: TablesDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<TableRecord>[] = [
    {
      accessorKey: "tableCode",
      header: "Table Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("tableCode")}</div>
      ),
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => <div>{row.getValue("area")}</div>,
    },
    {
      accessorKey: "capacity",
      header: "Capacity",
      cell: ({ row }) => <div>{row.getValue("capacity")} Seats</div>,
    },
    {
      accessorKey: "canTakeMultipleOrder",
      header: "Multiple Order",
      cell: ({ row }) => {
        const value = row.getValue("canTakeMultipleOrder") as boolean;
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Yes" : "No"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("remarks") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant={"outline"}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
          >
            <Edit className="w-4 h-4 " />
          </Button>
          <Button
            variant={"outline"}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.original.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground font-semibold"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border hover:bg-secondary/50 cursor-pointer"
                  onClick={() => onEdit(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tables found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
