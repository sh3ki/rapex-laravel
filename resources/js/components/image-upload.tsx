import { ImagePlus, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { notify } from '@/lib/toast';

const MAX_FILE_SIZE = 1024 * 1024;

export function ImageUpload({
    value,
    onChange,
    initialPreview = '',
    label = 'image',
    maxSize = MAX_FILE_SIZE,
}: {
    value: File | null;
    onChange: (file: File | null) => void;
    initialPreview?: string;
    label?: string;
    maxSize?: number;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState(initialPreview);
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        if (value) {
            objectUrlRef.current = URL.createObjectURL(value);
            setPreview(objectUrlRef.current);
        } else {
            setPreview(initialPreview);
        }

        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [initialPreview, value]);

    const select = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            notify.error('Please choose an image file.');
            return;
        }
        if (file.size > maxSize) {
            notify.error(`Please choose an image no larger than ${Math.round(maxSize / 1024 / 1024)} MB.`);
            return;
        }
        onChange(file);
    };

    const remove = () => {
        onChange(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="bg-muted group relative flex min-h-32 w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault();
                            select(event.dataTransfer.files[0]);
                        }}
                        aria-label={`Upload ${label}`}
                    >
                        {preview ? (
                            <img src={preview} alt={`${label} preview`} className="size-full max-h-52 object-contain" />
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center gap-2 p-4 text-center text-sm">
                                <ImagePlus className="size-8" />
                                <span>Click to upload or drag an image here</span>
                            </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <Pencil className="size-5" />
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>Click to upload or drag an image here.</TooltipContent>
            </Tooltip>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => select(event.target.files?.[0])}
            />
            {value && (
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={remove}>
                    <X /> Remove
                </Button>
            )}
            <p className="text-muted-foreground text-xs">Optional. Image files only, maximum 1 MB.</p>
        </div>
    );
}
