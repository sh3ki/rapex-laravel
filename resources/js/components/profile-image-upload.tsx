import { Crop, ImagePlus, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/toast';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function ProfileImageUpload({
    value,
    onChange,
    initialPreview = '',
    align = 'center',
    aspectRatio = 1,
    shape = 'circle',
    name,
    disabled = false,
}: {
    value: File | null;
    onChange: (file: File | null) => void;
    initialPreview?: string;
    align?: 'center' | 'start';
    aspectRatio?: number;
    shape?: 'circle' | 'rectangle';
    name?: string;
    disabled?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState('');
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropUrl, setCropUrl] = useState('');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 });
    const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
    useEffect(() => {
        setPreview(value ? URL.createObjectURL(value) : initialPreview);
    }, [initialPreview, value]);

    const cropToRatio = async (file: File, zoom = 1, offset = { x: 0, y: 0 }): Promise<File> => {
        const source = URL.createObjectURL(file);
        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const element = new Image();
                element.onload = () => resolve(element);
                element.onerror = reject;
                element.src = source;
            });
            const viewportWidth = 256;
            const viewportHeight = 256 / aspectRatio;
            const imageRatio = image.naturalWidth / image.naturalHeight;
            const baseScale = imageRatio > aspectRatio ? viewportWidth / image.naturalWidth : viewportHeight / image.naturalHeight;
            const cropWidth = Math.min(image.naturalWidth, viewportWidth / (baseScale * zoom));
            const cropHeight = Math.min(image.naturalHeight, viewportHeight / (baseScale * zoom));
            const maxOffsetX = (image.naturalWidth - cropWidth) / 2;
            const maxOffsetY = (image.naturalHeight - cropHeight) / 2;
            const sourceOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x / (baseScale * zoom)));
            const sourceOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y / (baseScale * zoom)));
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = Math.round(800 / aspectRatio);
            canvas.getContext('2d')?.drawImage(
                image,
                (image.naturalWidth - cropWidth) / 2 - sourceOffsetX,
                (image.naturalHeight - cropHeight) / 2 - sourceOffsetY,
                cropWidth,
                cropHeight,
                0,
                0,
                800,
                canvas.height,
            );
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (!blob) return file;
            return new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
        } finally {
            URL.revokeObjectURL(source);
        }
    };

    const select = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            notify.error('Please choose an image file.');
            return;
        }
        setCropFile(file);
        setCropUrl(URL.createObjectURL(file));
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
        setCropImageSize({ width: 0, height: 0 });
    };

    const confirmCrop = async () => {
        if (!cropFile) return;
        const cropped = await cropToRatio(cropFile, cropZoom, cropOffset);
        if (cropped.size > 1024 * 1024) {
            notify.error('Please choose an image that crops to no larger than 1 MB.');
            return;
        }
        setPreview(URL.createObjectURL(cropped));
        onChange(cropped);
        if (inputRef.current) {
            const transfer = new DataTransfer();
            transfer.items.add(cropped);
            inputRef.current.files = transfer.files;
        }
        setCropFile(null);
        setCropUrl('');
    };

    return (
        <div className={`flex flex-col gap-2 ${align === 'start' ? 'items-start' : 'items-center'}`}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={`bg-muted group relative flex ${shape === 'circle' ? 'size-28 rounded-full' : 'w-80 max-w-full rounded-md'} items-center justify-center overflow-hidden border-2 border-dashed transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
                        style={shape === 'rectangle' ? { aspectRatio } : undefined}
                        onClick={() => !disabled && inputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault();
                            select(event.dataTransfer.files[0]);
                        }}
                        aria-label="Upload profile picture"
                        aria-disabled={disabled}
                    >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Profile preview"
                            className={`size-full ${shape === 'rectangle' ? 'object-contain' : 'object-cover'}`}
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
                name={name}
                type="file"
                accept="image/*"
                disabled={disabled}
                className="hidden"
                onChange={(event) => select(event.target.files?.[0])}
            />
            {value && !disabled && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        onChange(null);
                        setPreview('');
                            if (inputRef.current) inputRef.current.value = '';
                    }}
                >
                    <X /> Remove
                </Button>
            )}
            <p className="text-muted-foreground text-xs">
                Optional. Maximum file size: 1 MB.
            </p>
            <Dialog open={Boolean(cropFile)} onOpenChange={(open) => !open && setCropFile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crop {shape === 'circle' ? 'profile' : 'banner'} image</DialogTitle>
                        <DialogDescription>Adjust the zoom and position so your image fits the {aspectRatio === 1 ? 'square' : '4:2'} crop frame.</DialogDescription>
                    </DialogHeader>
                    <div
                        className="relative mx-auto flex w-64 touch-none cursor-move items-center justify-center overflow-hidden rounded-md border bg-black"
                        style={{ aspectRatio }}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            dragStart.current = { x: event.clientX, y: event.clientY, offsetX: cropOffset.x, offsetY: cropOffset.y };
                        }}
                        onPointerMove={(event) => {
                            if (!dragStart.current) return;
                            const viewportWidth = 256;
                            const viewportHeight = 256 / aspectRatio;
                            const imageRatio = cropImageSize.width / cropImageSize.height;
                            // Match CSS object-contain so the complete source
                            // image is visible while the user positions the crop.
                            const baseWidth = imageRatio > aspectRatio ? viewportWidth : viewportHeight * imageRatio;
                            const baseHeight = imageRatio > aspectRatio ? viewportWidth / imageRatio : viewportHeight;
                            const maxX = Math.max(0, (baseWidth * cropZoom - viewportWidth) / 2);
                            const maxY = Math.max(0, (baseHeight * cropZoom - viewportHeight) / 2);
                            setCropOffset({
                                x: Math.max(-maxX, Math.min(maxX, dragStart.current.offsetX + event.clientX - dragStart.current.x)),
                                y: Math.max(-maxY, Math.min(maxY, dragStart.current.offsetY + event.clientY - dragStart.current.y)),
                            });
                        }}
                        onPointerUp={() => { dragStart.current = null; }}
                        onPointerCancel={() => { dragStart.current = null; }}
                    >
                        {cropUrl && <img src={cropUrl} alt="Crop preview" className="absolute inset-0 size-full select-none object-contain" onLoad={(event) => setCropImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`, transformOrigin: 'center' }} draggable={false} />}
                        {shape === 'circle' ? <div className="pointer-events-none absolute inset-3 rounded-full border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" /> : <div className="pointer-events-none absolute inset-3 shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" />}
                        <div className="pointer-events-none absolute inset-3">
                            <span className="absolute left-0 top-0 size-5 border-l-2 border-t-2 border-white" />
                            <span className="absolute right-0 top-0 size-5 border-r-2 border-t-2 border-white" />
                            <span className="absolute bottom-0 left-0 size-5 border-b-2 border-l-2 border-white" />
                            <span className="absolute bottom-0 right-0 size-5 border-b-2 border-r-2 border-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">Drag the image to reposition it. Use the {aspectRatio === 1 ? 'square' : 'horizontal 4:2'} guide to choose the crop.</p>
                        <label htmlFor="profile-crop-zoom" className="text-sm font-medium">Zoom</label>
                        <input id="profile-crop-zoom" type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} className="w-full" />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCropFile(null)}>Cancel</Button>
                        <Button type="button" onClick={() => void confirmCrop()}><Crop /> Use cropped image</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
