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
    const currentPage = Math.min(Math.max(page, 1), pages);
    const control = (disabled: boolean, icon: React.ReactNode, label: string, next: number) => (
        <Button variant="ghost" size="icon" className="size-8" disabled={disabled} onClick={() => onPageChange(next)} aria-label={label}>{icon}</Button>
    );

    const pageNumbers = pages <= 3
        ? Array.from({ length: pages }, (_, index) => index + 1)
        : currentPage === 1
            ? [1, 2, 3]
            : currentPage === pages
                ? [pages - 2, pages - 1, pages]
                : [currentPage - 1, currentPage, currentPage + 1];

    const pageItems = pageNumbers.flatMap((pageNumber, index) => {
        const previousPage = pageNumbers[index - 1];
        const items: React.ReactNode[] = [];

        if (previousPage && pageNumber - previousPage > 1) {
            items.push(<span key={`ellipsis-${pageNumber}`} className="flex size-8 items-center justify-center" aria-hidden="true">...</span>);
        }

        items.push(
            <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? 'outline' : 'ghost'}
                size="icon"
                className="size-8"
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(pageNumber)}
            >
                {pageNumber}
            </Button>,
        );

        return items;
    });

    return (
        <div className="text-muted-foreground flex min-w-max shrink-0 items-center gap-3 whitespace-nowrap text-xs">
            {onPageSizeChange && <div className="flex items-center gap-2"><span>Rows</span><Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}><SelectTrigger size="sm" className="w-[4.25rem]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select></div>}
            <span>Page {currentPage} of {pages}</span>
            <div className="flex items-center">
                {control(currentPage === 1, <ChevronsLeft />, 'First page', 1)}
                {control(currentPage === 1, <ChevronLeft />, 'Previous page', currentPage - 1)}
                {pageItems}
                {control(currentPage === pages, <ChevronRight />, 'Next page', currentPage + 1)}
                {control(currentPage === pages, <ChevronsRight />, 'Last page', pages)}
            </div>
        </div>
    );
}
