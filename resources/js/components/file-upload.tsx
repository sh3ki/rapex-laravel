import { FileText, Upload, X } from 'lucide-react';
import { DragEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/toast';

type Props = {
    value: File | null;
    onChange: (file: File | null) => void;
    accept?: string;
    label?: string;
    maxSizeMb?: number;
};

export function FileUpload({ value, onChange, accept = 'image/*,.pdf', label = 'Choose a file or drag it here', maxSizeMb = 3 }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const select = (file?: File) => {
        if (!file) return;
        const validType = file.type.startsWith('image/') || file.type === 'application/pdf';
        if (!validType) { notify.error('Please choose an image or PDF file.'); return; }
        if (file.size > maxSizeMb * 1024 * 1024) { notify.error(`Please choose a file no larger than ${maxSizeMb} MB.`); return; }
        onChange(file);
    };
    const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); select(event.dataTransfer.files[0]); };

    return <div className="space-y-2">
        <div role="button" tabIndex={0} className="flex min-h-16 w-full items-center gap-3 rounded-md border border-dashed p-3 text-left transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={drop}>
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm">{value?.name ?? label}</span>
            {value ? <><span className="shrink-0 text-xs text-muted-foreground">{(value.size / 1024 / 1024).toFixed(2)} MB</span><Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={(event) => { event.stopPropagation(); onChange(null); }} aria-label={`Remove ${value.name}`}><X /></Button></> : <Upload className="size-4 shrink-0 text-muted-foreground" />}
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(event) => { select(event.target.files?.[0]); event.currentTarget.value = ''; }} />
    </div>;
}
