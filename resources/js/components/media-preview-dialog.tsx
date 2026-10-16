import { FileText, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type PreviewMedia = {
    src: string;
    label: string;
    mimeType?: string | null;
};

export default function MediaPreviewDialog({
    media,
    onClose,
}: {
    media: PreviewMedia | null;
    onClose: () => void;
}) {
    const isPdf = media?.mimeType === 'application/pdf' || media?.src.toLowerCase().includes('.pdf');
    const isImage = media?.mimeType?.startsWith('image/') === true;

    return (
        <Dialog open={media !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[min(96vw,1100px)] !max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{media?.label}</DialogTitle>
                </DialogHeader>
                {media && isImage && (
                    <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-lg bg-muted/30 p-2">
                        <img src={media.src} alt={media.label} className="max-h-[72vh] max-w-full object-contain" />
                    </div>
                )}
                {media && isPdf && (
                    <iframe title={media.label} src={media.src} className="h-[75vh] w-full rounded-lg border" />
                )}
                {media && !isImage && !isPdf && (
                    <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                        <FileText className="size-10" />
                        <a href={media.src} target="_blank" rel="noreferrer" className="text-primary underline">
                            Open file
                        </a>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
