import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    render?: (row: T) => React.ReactNode;
    value?: (row: T) => string | number;
};

type Sort = { key: string; direction: 'asc' | 'desc' } | null;

export default function DataTable<T>({
    rows,
    columns,
    getRowId,
    selectedIds,
    onSelectionChange,
    onRowClick,
    inlineActions = false,
    actions,
    emptyMessage = 'No records found.',
}: {
    rows: T[];
    columns: DataTableColumn<T>[];
    getRowId: (row: T) => string | number;
    selectedIds: Array<string | number>;
    onSelectionChange: (ids: Array<string | number>) => void;
    onRowClick?: (row: T) => void;
    inlineActions?: boolean;
    actions?: (row: T) => React.ReactNode;
    emptyMessage?: string;
}) {
    const [sort, setSort] = useState<Sort>(null);
    const sortedRows = useMemo(() => {
        if (!sort) return rows;
        const column = columns.find((item) => item.key === sort.key);
        if (!column?.value) return rows;
        return [...rows].sort((a, b) => {
            const left = column.value!(a);
            const right = column.value!(b);
            const comparison = String(left).localeCompare(String(right), undefined, {
                numeric: true,
                sensitivity: 'base',
            });
            return sort.direction === 'asc' ? comparison : -comparison;
        });
    }, [columns, rows, sort]);
    const ids = sortedRows.map(getRowId);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    const someSelected = !allSelected && ids.some((id) => selectedIds.includes(id));

    const toggleAll = () =>
        onSelectionChange(allSelected ? [] : Array.from(new Set([...selectedIds, ...ids])));

    const toggleRow = (id: string | number) =>
        onSelectionChange(
            selectedIds.includes(id)
                ? selectedIds.filter((selectedId) => selectedId !== id)
                : [...selectedIds, id],
        );

    return (
        <div className="border-border overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-muted/40 text-muted-foreground border-border border-b text-left text-xs">
                        <tr>
                                <th className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={someSelected ? 'indeterminate' : allSelected}
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all rows"
                                />
                                        {selectedIds.length > 0 && <span className="text-muted-foreground text-xs font-normal">{selectedIds.length}/{ids.length}</span>}
                                    </div>
                                </th>
                            {columns.map((column) => (
                                <th key={column.key} className={cn('px-3 py-3 font-medium', column.className)}>
                                    {column.sortable ? (
                                        <button
                                            type="button"
                                            className="hover:text-foreground inline-flex items-center gap-1"
                                            onClick={() =>
                                                setSort((current) => ({
                                                    key: column.key,
                                                    direction:
                                                        current?.key === column.key && current.direction === 'asc'
                                                            ? 'desc'
                                                            : 'asc',
                                                }))
                                            }
                                        >
                                            {column.label}
                                            {sort?.key === column.key ? (
                                                sort.direction === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                                            ) : <ArrowUpDown className="size-3 opacity-50" />}
                                        </button>
                                    ) : column.label}
                                </th>
                            ))}
                            {actions && <th className="px-3 py-3 font-medium">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {sortedRows.length === 0 ? (
                            <tr><td colSpan={columns.length + 2} className="text-muted-foreground px-4 py-12 text-center">{emptyMessage}</td></tr>
                        ) : sortedRows.map((row) => {
                            const id = getRowId(row);
                            return (
                                <tr key={String(id)} className={cn('hover:bg-muted/30 transition-colors', onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(row)}>
                                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}><Checkbox checked={selectedIds.includes(id)} onCheckedChange={() => toggleRow(id)} aria-label="Select row" /></td>
                                    {columns.map((column) => <td key={column.key} className={cn('text-foreground px-3 py-3', column.className)}>{column.render ? column.render(row) : column.value?.(row)}</td>)}
                                    {actions && <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>{inlineActions ? <div className="flex items-center gap-2">{actions(row)}</div> : <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="text-muted-foreground hover:text-foreground rounded-md p-1.5" aria-label="Row actions"><MoreHorizontal className="size-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end">{actions(row)}</DropdownMenuContent></DropdownMenu>}</td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
