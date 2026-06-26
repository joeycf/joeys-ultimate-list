"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Criterion, RubricField, TopItemData } from "@/lib/types";

const fmtScore = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const ALL = "__all__";

function isNumericCol(id: string) {
  return id === "rank" || id === "score" || id.startsWith("r_");
}

export function TopDataTable({
  criteria,
  fields,
  items,
}: {
  criteria: Criterion[];
  fields: RubricField[];
  items: TopItemData[];
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "score", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [titleQuery, setTitleQuery] = useState("");

  const columns = useMemo<ColumnDef<TopItemData>[]>(() => {
    const cols: ColumnDef<TopItemData>[] = [
      {
        accessorKey: "rank",
        header: "#",
        sortingFn: "basic",
        cell: ({ row }) => (
          <span className="font-mono tabular-nums text-gold">
            {String(row.original.rank).padStart(2, "0")}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
    ];
    for (const c of criteria) {
      cols.push({
        id: `r_${c.key}`,
        accessorFn: (row) => Number(row.ratings?.[c.key] ?? 0),
        header: c.label,
        sortingFn: "basic",
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums text-muted-foreground">
            {Number(getValue())}
          </span>
        ),
      });
    }
    cols.push({
      accessorKey: "score",
      header: "Score",
      sortingFn: "basic",
      cell: ({ row }) => (
        <span className="font-mono font-semibold tabular-nums text-gold">
          {fmtScore(row.original.score)}
        </span>
      ),
    });
    for (const f of fields) {
      cols.push({
        id: `f_${f.key}`,
        accessorFn: (row) => {
          const v = row.fieldValues?.[f.key];
          return v == null ? "" : String(v);
        },
        header: f.label,
        filterFn: f.type === "select" ? "equalsString" : "includesString",
        cell: ({ getValue }) => {
          const v = String(getValue() ?? "");
          return v ? (
            <span>{v}</span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          );
        },
      });
    }
    return cols;
  }, [criteria, fields]);

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, columnFilters, globalFilter: titleQuery },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setTitleQuery,
    globalFilterFn: (row, _columnId, value) =>
      row.original.title.toLowerCase().includes(String(value).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectFields = fields.filter((f) => f.type === "select");
  const textFields = fields.filter((f) => f.type === "text");

  const optionsFor = (key: string) =>
    [
      ...new Set(
        items
          .map((i) => i.fieldValues?.[key])
          .filter((v) => v != null && v !== "")
          .map(String)
      ),
    ].sort();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Full stats
      </h3>

      {/* Toolbar: title search + per-field filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Search title…"
            className="h-8 w-48 pl-8 text-sm"
          />
        </div>

        {selectFields.map((f) => {
          const col = table.getColumn(`f_${f.key}`);
          const current = (col?.getFilterValue() as string) ?? ALL;
          return (
            <Select
              key={f.key}
              value={current || ALL}
              onValueChange={(v) =>
                col?.setFilterValue(v === ALL ? undefined : v)
              }
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All {f.label}</SelectItem>
                {optionsFor(f.key).map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {textFields.map((f) => {
          const col = table.getColumn(`f_${f.key}`);
          return (
            <Input
              key={f.key}
              value={(col?.getFilterValue() as string) ?? ""}
              onChange={(e) => col?.setFilterValue(e.target.value)}
              placeholder={`Filter ${f.label}…`}
              className="h-8 w-40 text-sm"
            />
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const numeric = isNumericCol(h.column.id);
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead
                      key={h.id}
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-widest",
                        numeric && "text-right"
                      )}
                    >
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          numeric && "flex-row-reverse",
                          sorted && "text-foreground"
                        )}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "text-sm",
                        isNumericCol(cell.column.id) && "text-right"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No matching items.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
