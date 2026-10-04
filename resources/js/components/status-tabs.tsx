import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export type StatusTab = { value: string; label: string; count?: number };

export default function StatusTabs({
    tabs,
    value,
    onChange,
    collapsible = false,
}: {
    tabs: StatusTab[];
    value: string;
    onChange: (value: string) => void;
    collapsible?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const visibleTabs = collapsible && !expanded
        ? tabs.filter((tab, index) => index < 3 || tab.value === value)
        : tabs;

    return (
        <div className="status-tabs-scrollbar bg-muted inline-flex max-w-full gap-1 overflow-x-auto rounded-lg p-1">
            {visibleTabs.map((tab) => (
                <button
                    key={tab.value}
                    type="button"
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        'text-muted-foreground inline-flex shrink-0 items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors',
                        value === tab.value
                            ? 'bg-background text-foreground shadow-xs'
                            : 'hover:bg-background/60 hover:text-foreground',
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="text-muted-foreground text-xs">
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
            {collapsible && tabs.length > 3 && (
                <button
                    type="button"
                    onClick={() => setExpanded((current) => !current)}
                    className="text-muted-foreground inline-flex shrink-0 items-center justify-center rounded-md px-2 transition-colors hover:bg-background/60 hover:text-foreground"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Collapse status filters' : 'Expand status filters'}
                    title={expanded ? 'Collapse status filters' : 'Expand status filters'}
                >
                    {expanded ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
            )}
        </div>
    );
}
