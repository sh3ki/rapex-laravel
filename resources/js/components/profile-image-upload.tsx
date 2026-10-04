import { ImagePlus, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/toast';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function ProfileImageUpload({
    value,
    onChange,
    initialPreview = '',
}: {
    value: File | null;
    onChange: (file: File | null) => void;
    initialPreview?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState('');
    useEffect(() => {
        setPreview(value ? URL.createObjectURL(value) : initialPreview);
    }, [initialPreview, value]);

    const select = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 1024 * 1024) {
            notify.error('Please choose an image no larger than 1 MB.');
            return;
        }
        setPreview(URL.createObjectURL(file));
        onChange(file);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="bg-muted group relative flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault();
                            select(event.dataTransfer.files[0]);
                        }}
                        aria-label="Upload profile picture"
                    >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Profile preview"
                            className="size-full object-cover"
                        />
                    ) : (
                        <ImagePlus className="text-muted-foreground size-8" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="size-5" />
                    </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>Click to upload or drag an image onto the avatar.</TooltipContent>
            </Tooltip>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => select(event.target.files?.[0])}
            />
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        onChange(null);
                        setPreview('');
                    }}
                >
                    <X /> Remove
                </Button>
            )}
            <p className="text-muted-foreground text-xs">
                Optional. Maximum file size: 1 MB.
            </p>
        </div>
    );
}
