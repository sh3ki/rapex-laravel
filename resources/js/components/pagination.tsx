import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Pagination({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
}: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);
    const control = (disabled: boolean, icon: React.ReactNode, label: string, next: number) => (
        <Button variant="ghost" size="icon" className="size-8" disabled={disabled} onClick={() => onPageChange(next)} aria-label={label}>{icon}</Button>
    );
    return (
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
            {onPageSizeChange && <div className="flex items-center gap-2"><span>Rows</span><Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}><SelectTrigger size="sm" className="w-[4.25rem]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select></div>}
            <span>Page {page} of {pages}</span>
            <div className="flex items-center">{control(page === 1, <ChevronsLeft />, 'First page', 1)}{control(page === 1, <ChevronLeft />, 'Previous page', page - 1)}{control(page === pages, <ChevronRight />, 'Next page', page + 1)}{control(page === pages, <ChevronsRight />, 'Last page', pages)}</div>
        </div>
    );
}
