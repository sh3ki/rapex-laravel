import { Camera, RotateCcw, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    label: string;
    instruction: string;
    facingMode?: 'user' | 'environment';
    value: File | null;
    onChange: (file: File | null) => void;
    required?: boolean;
    initialPreview?: string;
};

export function CameraCapture({
    label,
    instruction,
    facingMode = 'environment',
    value,
    onChange,
    required = true,
    initialPreview = '',
}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [open, setOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [error, setError] = useState('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState('');
    const [preview, setPreview] = useState('');
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [capturedPreview, setCapturedPreview] = useState('');
    useEffect(() => {
        setPreview(value ? URL.createObjectURL(value) : initialPreview);
    }, [initialPreview, value]);

    const stop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };
    const start = async (requestedDeviceId?: string) => {
        stop();
        try {
            const activeDeviceId = requestedDeviceId ?? deviceId;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: activeDeviceId
                    ? { deviceId: { exact: activeDeviceId } }
                    : { facingMode },
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            const detected = await navigator.mediaDevices.enumerateDevices();
            setDevices(
                detected.filter((device) => device.kind === 'videoinput'),
            );
            setDeviceId(
                stream.getVideoTracks()[0]?.getSettings().deviceId ??
                    requestedDeviceId ??
                    '',
            );
            setError('');
        } catch {
            const message = 'Camera access is required. Please allow camera access and try again.';
            setError(message);
            notify.error(message);
        }
    };
    useEffect(() => () => stop(), []);
    const capture = async () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * 0.8);
        canvas.height = Math.round(video.videoHeight * 0.8);
        canvas
            .getContext('2d')
            ?.drawImage(video, 0, 0, canvas.width, canvas.height);
        let file = await new Promise<File>((resolve) =>
            canvas.toBlob(
                (blob) =>
                    resolve(
                        new File(
                            [blob!],
                            `${label.toLowerCase().replaceAll(' ', '-')}.jpg`,
                            { type: 'image/jpeg' },
                        ),
                    ),
                'image/jpeg',
                0.9,
            ),
        );
        for (const quality of [0.8, 0.7, 0.6, 0.5]) {
            if (file.size <= 1024 * 1024) break;
            file = await new Promise<File>((resolve) =>
                canvas.toBlob(
                    (blob) =>
                        resolve(
                            new File(
                                [blob!],
                                `${label.toLowerCase().replaceAll(' ', '-')}.jpg`,
                                { type: 'image/jpeg' },
                            ),
                        ),
                    'image/jpeg',
                    quality,
                ),
            );
        }
        if (file.size > 1024 * 1024) {
            const message = 'The captured image is still larger than 1 MB. Move farther from the camera and try again.';
            setError(message);
            notify.error(message);
            return;
        }
        setCapturedFile(file);
        setCapturedPreview(URL.createObjectURL(file));
        stop();
    };
    const confirmCapture = () => {
        if (!capturedFile) return;
        onChange(capturedFile);
        setPreview(capturedPreview);
        setCapturedFile(null);
        setCapturedPreview('');
        setOpen(false);
    };
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive"> *</span>}
            </p>
            <div className="flex flex-col items-start gap-3">
                {preview ? (
                    <div className="relative w-full max-w-sm">
                        <button
                            type="button"
                            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={() => setPreviewOpen(true)}
                            aria-label={`View ${label} image in full size`}
                        >
                            <img
                                src={preview}
                                alt={`${label} preview`}
                                className="aspect-[4/3] w-full rounded-md border object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                Click to enlarge
                            </span>
                        </button>
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 size-8 rounded-full" onClick={() => { onChange(null); setPreview(''); }} aria-label={`Remove ${label} image`} title={`Remove ${label} image`}><X /></Button>
                    </div>
                ) : (
                    <div className="bg-muted text-muted-foreground flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-md border">
                        <Video />
                    </div>
                )}
                <div className="flex w-full max-w-sm justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setCapturedFile(null);
                            setCapturedPreview('');
                            setOpen(true);
                            void start();
                        }}
                    >
                        <Camera /> {value ? `Retake ${label}` : `Capture ${label}`}
                    </Button>
                </div>
            </div>
            {error && (
                <div className="flex items-center justify-center gap-3">
                    <span className="sr-only">{error}</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setError('');
                            setOpen(true);
                            void start();
                        }}
                    >
                        Try again
                    </Button>
                </div>
            )}
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) stop();
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{label} capture</DialogTitle>
                        <DialogDescription>{instruction}</DialogDescription>
                    </DialogHeader>
                    {capturedPreview ? <img src={capturedPreview} alt={`${label} captured preview`} className="mx-auto aspect-[4/3] max-h-[55vh] w-full rounded-md bg-black object-contain" /> : <>
                    {devices.length > 1 && (
                        <select
                            className="bg-background h-9 rounded-md border px-3 text-sm"
                            value={deviceId}
                            onChange={(event) => {
                                setDeviceId(event.target.value);
                                void start(event.target.value);
                            }}
                        >
                            <option value="">Default camera</option>
                            {devices.map((device) => (
                                <option
                                    key={device.deviceId}
                                    value={device.deviceId}
                                >
                                    {device.label || 'Camera'}
                                </option>
                            ))}
                        </select>
                    )}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="mx-auto aspect-[4/3] max-h-[55vh] w-full rounded-md bg-black object-contain"
                    />
                    </>}
                    <DialogFooter>
                        {capturedPreview ? <><Button type="button" variant="outline" onClick={() => { setCapturedFile(null); setCapturedPreview(''); void start(); }}><RotateCcw /> Retake</Button><Button type="button" onClick={confirmCapture}><Camera /> Confirm photo</Button></> : <Button type="button" onClick={() => void capture()}><Camera /> Capture</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {preview && (
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>{label} image preview</DialogTitle>
                            <DialogDescription>
                                Full-size preview of the captured image.
                            </DialogDescription>
                        </DialogHeader>
                        <img
                            src={preview}
                            alt={`${label} full-size preview`}
                            className="max-h-[75vh] w-full rounded-md object-contain"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
