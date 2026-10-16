import { Head, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock3,
    AlertCircle,
    MapPin,
    LocateFixed,
    ShieldCheck,
    UserRound,
    CheckCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { LocationMap } from '@/components/location-map';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { AddressZipCodeField, SearchableAddressFields } from '@/components/searchable-address-fields';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { notify } from '@/lib/toast';

type Merchant = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    phone_number: string;
};
type Application = (Record<string, any> & {
    media?: Record<string, string | null>;
}) | null;
type Props = {
    merchant: Merchant;
    application: Application;
    googleMapsApiKey?: string;
};
type Draft = Record<string, string | number | null>;

const draftKey = (merchantId: number) =>
    `rapex:merchant-onboarding:${merchantId}:draft`;
const imageDb = 'rapex-merchant-onboarding';
const onboardingSteps = [
    { label: 'Profile', icon: UserRound },
    { label: 'Location', icon: MapPin },
    { label: 'Verification', icon: ShieldCheck },
    { label: 'Review', icon: ClipboardCheck },
];
const genderOptions = [
    ['male', 'Male'],
    ['female', 'Female'],
    ['non-binary', 'Non-binary'],
    ['other', 'Other'],
    ['prefer-not-to-say', 'Prefer not to say'],
] as const;
const idTypeOptions = [
    'National ID (PhilSys)',
    "Driver's License",
    'Passport',
    'UMID',
    'Postal ID',
    'SSS ID',
    'PhilHealth ID',
    'PRC ID',
    'TIN ID',
    "Voter's ID",
    'NBI Clearance',
    'Other Government-Issued ID',
] as const;
function openImageDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(imageDb, 1);
        request.onupgradeneeded = () =>
            request.result.createObjectStore('images');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function saveImage(key: string, file: File | null) {
    if (!file) return;
    const db = await openImageDb();
    const transaction = db.transaction('images', 'readwrite');
    transaction.objectStore('images').put(file, key);
}
async function loadImage(key: string): Promise<File | null> {
    try {
        const db = await openImageDb();
        return await new Promise((resolve) => {
            const request = db
                .transaction('images')
                .objectStore('images')
                .get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

export default function MerchantOnboarding({
    merchant,
    application,
    googleMapsApiKey,
}: Props) {
    const merchantDraftKey = draftKey(merchant.id);
    const initial: Draft = useMemo(
        () => ({
            first_name: merchant.first_name,
            middle_name: merchant.middle_name ?? '',
            last_name: merchant.last_name,
            email: merchant.email,
            phone_number: merchant.phone_number,
            date_of_birth: application?.date_of_birth ?? '',
            gender: application?.gender ?? '',
            nationality: application?.nationality ?? 'Filipino',
            house_unit_building: application?.house_unit_building ?? '',
            street: application?.street ?? '',
            barangay: application?.barangay ?? '',
            city_municipality: application?.city_municipality ?? '',
            province: application?.province ?? '',
            region: application?.region ?? '',
            zip_code: application?.zip_code ?? '',
            latitude: application?.latitude
                ? Number(application.latitude)
                : null,
            longitude: application?.longitude
                ? Number(application.longitude)
                : null,
            id_type: application?.id_type ?? '',
        }),
        [merchant, application],
    );
    const [draft, setDraft] = useState<Draft>(() =>
        JSON.parse(
            localStorage.getItem(merchantDraftKey) || JSON.stringify(initial),
        ),
    );
    const [files, setFiles] = useState<Record<string, File | null>>({
        profile_image: null,
        id_front_image: null,
        id_back_image: null,
        selfie_image: null,
    });
    const [step, setStep] = useState(1);
    const [locationError, setLocationError] = useState('');
    const [locating, setLocating] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [editingRejected, setEditingRejected] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [agreedToPolicies, setAgreedToPolicies] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);

    useEffect(() => {
        if (locationError) notify.error(locationError);
    }, [locationError]);
    useEffect(() => {
        if (application?.status === 'rejected') {
            notify.error(
                application.rejection_reason ||
                    'Your merchant application requires changes.',
            );
        }
    }, [application?.rejection_reason, application?.status]);

    useEffect(() => {
        localStorage.setItem(merchantDraftKey, JSON.stringify(draft));
    }, [draft, merchantDraftKey]);
    useEffect(() => {
        void Promise.all(
            [
                'profile_image',
                'id_front_image',
                'id_back_image',
                'selfie_image',
            ].map(async (key) => {
                const storedFile = await loadImage(key);
                if (storedFile) {
                    setFiles((current) => ({ ...current, [key]: storedFile }));
                    return;
                }

                const url = application?.media?.[key];
                if (!url) return;
                try {
                    const response = await fetch(url, { credentials: 'same-origin' });
                    if (!response.ok) return;
                    const blob = await response.blob();
                    const file = new File([blob], `${key}.jpg`, {
                        type: blob.type || 'image/jpeg',
                    });
                    setFiles((current) => ({ ...current, [key]: file }));
                    await saveImage(key, file);
                } catch {
                    // The remote URL is still used as a visual fallback below.
                }
            }),
        );
    }, [application]);
    const requestLocation = () => {
            if (!navigator.geolocation) {
                setLocationError('Location access is not available in this browser.');
                setLocating(false);
                return;
            }
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDraft((current) => ({
                        ...current,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }));
                    setLocationError('');
                    setLocating(false);
                },
                () => {
                    setLocationError(
                        'Location access is required to complete merchant onboarding. Please allow access and try again.',
                    );
                    setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000 },
            );
    };
    useEffect(() => {
        if (application?.status === 'pending' || application?.status === 'approved') return;
        requestLocation();
    }, []);

    if (application?.status === 'rejected' && !editingRejected) {
        return (
            <>
                <Head title="Application needs changes" />
                <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                    <div>
                        <p className="text-primary text-sm font-medium">Merchant application</p>
                        <h1 className="text-3xl font-semibold">Your application needs changes</h1>
                        <p className="text-muted-foreground mt-2">
                            Please review the administrator&apos;s feedback, update your application, and submit it again.
                        </p>
                    </div>
                    <Card className="border-destructive/40">
                        <CardContent className="space-y-5 p-6 sm:p-8">
                            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                <AlertCircle className="text-destructive mt-0.5 size-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Administrator feedback</p>
                                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                                        {application.rejection_reason || 'No specific reason was provided. Please review your information and identity documents before resubmitting.'}
                                    </p>
                                </div>
                            </div>
                            {application.reviewed_at && (
                                <p className="text-muted-foreground text-sm">
                                    Reviewed {new Date(application.reviewed_at).toLocaleDateString()}
                                </p>
                            )}
                            <Button type="button" onClick={() => setEditingRejected(true)}>
                                Update application
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </>
        );
    }

    if (application?.status === 'pending') {
        return (
            <>
                <Head title="Application pending review" />
                <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                    <div>
                        <p className="text-primary text-sm font-medium">
                            Merchant application
                        </p>
                        <h1 className="text-3xl font-semibold">
                            Application pending review
                        </h1>
                    </div>
                    <Card className="overflow-hidden">
                        <CardContent className="space-y-8 p-6 sm:p-8">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                                    <Clock3 className="size-8" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold">
                                        Your application is in the review queue
                                    </h2>
                                    <p className="text-muted-foreground max-w-2xl">
                                        Rapex Admin is reviewing your submitted information and verification documents. This usually takes up to 24 hours.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border p-4">
                                    <CheckCircle2 className="text-primary mb-3 size-5" />
                                    <p className="font-medium">Application submitted</p>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {application?.submitted_at
                                            ? new Date(application.submitted_at).toLocaleDateString()
                                            : 'Completed'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                                    <Clock3 className="text-primary mb-3 size-5" />
                                    <p className="font-medium">Admin review</p>
                                    <p className="text-muted-foreground mt-1 text-sm">In progress</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <ShieldCheck className="text-muted-foreground mb-3 size-5" />
                                    <p className="font-medium">Approval decision</p>
                                    <p className="text-muted-foreground mt-1 text-sm">You will be notified</p>
                                </div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 text-sm">
                                <p className="font-medium">What happens next?</p>
                                <p className="text-muted-foreground mt-1">
                                    Please keep your account information available. You can return here to check your application status, and you will be notified when the review is complete.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </>
        );
    }

    const update = (key: string, value: string | number | null) =>
        setDraft((current) => ({ ...current, [key]: value }));
    const setFile = (key: string, file: File | null) => {
        setFiles((current) => ({ ...current, [key]: file }));
        void saveImage(key, file);
    };
    const required = (keys: string[]) => {
        const next: Record<string, string> = {};
        keys.forEach((key) => {
            if (!draft[key]) next[key] = 'This field is required.';
        });
        setErrors(next);
        if (Object.keys(next).length) {
            notify.error('Please complete the required fields before continuing.');
        }
        return !Object.keys(next).length;
    };
    const nextStep = () => {
        if (
            step === 1 &&
            required([
                'first_name',
                'last_name',
                'date_of_birth',
                'gender',
                'nationality',
            ])
        )
            setStep(2);
        else if (
            step === 2 &&
            required([
                'house_unit_building',
                'street',
                'barangay',
                'city_municipality',
                'province',
                'region',
                'zip_code',
                'latitude',
                'longitude',
            ])
        )
            setStep(3);
        else if (
            step === 3 &&
            required(['id_type']) &&
            files.id_front_image &&
            files.id_back_image &&
            files.selfie_image
        )
            setStep(4);
    };
    const submit = () => {
        if (
            !files.id_front_image ||
            !files.id_back_image ||
            !files.selfie_image
        ) {
            notify.error('Please provide all required identity photos before submitting.');
            return;
        }
        router.post(
            '/onboarding',
            {
                ...draft,
                profile_image: files.profile_image,
                id_front_image: files.id_front_image,
                id_back_image: files.id_back_image,
                selfie_image: files.selfie_image,
            },
            {
                forceFormData: true,
                onStart: () => setSubmitted(true),
                onSuccess: () => {
                    localStorage.removeItem(merchantDraftKey);
                    void openImageDb().then((db) => {
                        const transaction = db.transaction(
                            'images',
                            'readwrite',
                        );
                        transaction.objectStore('images').clear();
                    });
                },
                onError: (next) => {
                    setErrors(next as Record<string, string>);
                    setSubmitted(false);
                },
            },
        );
    };
    const field = (
        key: string,
        label: string,
        type = 'text',
        disabled = false,
        required = false,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={key}>
                {label}
                {required ? <span className="text-destructive"> *</span> : <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}
            </Label>
            <Input
                id={key}
                type={type}
                value={String(draft[key] ?? '')}
                disabled={disabled}
                onChange={(event) => update(key, type === 'number' ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value)}
            />
            {errors[key] && (
                <p className="text-destructive text-sm">{errors[key]}</p>
            )}
        </div>
    );

    return (
        <>
            <Head title="Merchant onboarding" />
            <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                <div>
                    <p className="text-primary text-sm font-medium">
                        Merchant application
                    </p>
                    <h1 className="text-3xl font-semibold">
                        Complete your merchant profile
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        This information will be reviewed by Rapex Admin. Your
                        application is normally reviewed within 24 hours.
                    </p>
                </div>
                {application?.status === 'rejected' && (
                    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                        <AlertCircle className="text-destructive mt-0.5 size-5 shrink-0" />
                        <div>
                            <p className="font-semibold">Administrator feedback</p>
                            <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                                {application.rejection_reason || 'No specific reason was provided. Please review your information and identity documents before resubmitting.'}
                            </p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {onboardingSteps.map(({ label, icon: Icon }, index) => (
                            <div
                                key={label}
                                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-center text-sm transition-colors ${step === index + 1 ? 'border-primary bg-primary/10 font-medium' : 'text-muted-foreground'}`}
                            >
                                <Icon className="size-4 shrink-0" aria-hidden="true" />
                                <span>{index + 1} {label}</span>
                            </div>
                    ))}
                </div>
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile information</CardTitle>
                            <CardDescription>
                                Enter your personal information exactly as it
                                appears on your valid ID.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ProfileImageUpload
                                value={files.profile_image}
                                initialPreview={application?.media?.profile_image ?? ''}
                                onChange={(file) =>
                                    setFile('profile_image', file)
                                }
                            />
                            <div className="grid gap-5 md:grid-cols-3">
                            {field(
                                'first_name',
                                'First name',
                                'text',
                                false,
                                true,
                            )}
                            {field('middle_name', 'Middle name')}
                            {field(
                                'last_name',
                                'Last name',
                                'text',
                                false,
                                true,
                            )}
                            </div>
                            <div className="grid gap-5 md:grid-cols-3">
                            {field(
                                'date_of_birth',
                                'Date of birth',
                                'date',
                                false,
                                true,
                            )}
                            <div className="max-w-md space-y-2">
                                <Label>
                                    Gender
                                    <span className="text-destructive"> *</span>
                                </Label>
                                <Select
                                    value={String(draft.gender || '')}
                                    onValueChange={(value) =>
                                        update('gender', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {genderOptions.map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.gender && (
                                    <p className="text-destructive text-sm">
                                        {errors.gender}
                                    </p>
                                )}
                            </div>
                            {field(
                                'nationality',
                                'Nationality',
                                'text',
                                false,
                                true,
                            )}
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                            {field(
                                'email',
                                'Email address',
                                'email',
                                true,
                                true,
                            )}
                            {field(
                                'phone_number',
                                'Mobile number',
                                'text',
                                true,
                                true,
                            )}
                            </div>
                        </CardContent>
                    </Card>
                )}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                            <CardDescription>
                                All address fields and your detected coordinates
                                are required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 md:grid-cols-3">
                            <SearchableAddressFields
                                draft={draft}
                                update={update}
                                error={(key) => errors[key] && <p className="text-destructive text-sm">{errors[key]}</p>}
                            />
                            {field('street', 'Street', 'text', false, true)}
                            {field(
                                'house_unit_building',
                                'House/Unit/Bldg/Floor',
                                'text',
                                false,
                                true,
                            )}
                            <AddressZipCodeField
                                draft={draft}
                                error={(key) => errors[key] && <p className="text-destructive text-sm">{errors[key]}</p>}
                            />
                            {field(
                                'latitude',
                                'Latitude',
                                'number',
                                false,
                                true,
                            )}
                            {field(
                                'longitude',
                                'Longitude',
                                'number',
                                false,
                                true,
                            )}
                            <div className="flex items-end md:col-span-3">
                                <Button type="button" variant="outline" onClick={requestLocation} disabled={locating}>
                                    <LocateFixed className="size-4" />
                                    {locating ? 'Detecting...' : 'Use my current location'}
                                </Button>
                            </div>
                            <div className="md:col-span-3">
                                <LocationMap
                                    latitude={
                                        typeof draft.latitude === 'number'
                                            ? draft.latitude
                                            : null
                                    }
                                    longitude={
                                        typeof draft.longitude === 'number'
                                            ? draft.longitude
                                            : null
                                    }
                                    onLocationChange={({ latitude, longitude }) =>
                                        setDraft((current) => ({
                                            ...current,
                                            latitude: Number(latitude.toFixed(7)),
                                            longitude: Number(longitude.toFixed(7)),
                                        }))
                                    }
                                    googleMapsApiKey={googleMapsApiKey}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>ID and selfie verification</CardTitle>
                            <CardDescription>
                                Use clear, well-lit images. Do not cover any
                                text or security features.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="w-full space-y-2 md:w-1/2">
                                <Label>
                                    ID type
                                    <span className="text-destructive"> *</span>
                                </Label>
                                <Select
                                    value={String(draft.id_type || '')}
                                    onValueChange={(value) =>
                                        update('id_type', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select ID type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {idTypeOptions.map((value) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <CameraCapture
                                    label="ID front"
                                    instruction="Place the front of your valid government-issued ID inside the frame. Make sure all text is readable and avoid glare."
                                    value={files.id_front_image}
                                    initialPreview={application?.media?.id_front_image ?? ''}
                                    onChange={(file) =>
                                        setFile('id_front_image', file)
                                    }
                                />
                                <CameraCapture
                                    label="ID back"
                                    instruction="Turn the same ID over and capture the entire back. Keep all text and security marks visible."
                                    value={files.id_back_image}
                                    initialPreview={application?.media?.id_back_image ?? ''}
                                    onChange={(file) =>
                                        setFile('id_back_image', file)
                                    }
                                />
                            </div>
                            <CameraCapture
                                label="Selfie"
                                facingMode="user"
                                instruction="Face the camera directly, remove sunglasses or face coverings, use even lighting, and keep your full face inside the frame."
                                value={files.selfie_image}
                                initialPreview={application?.media?.selfie_image ?? ''}
                                onChange={(file) =>
                                    setFile('selfie_image', file)
                                }
                            />
                        </CardContent>
                    </Card>
                )}
                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Review merchant application</CardTitle>
                            <CardDescription>
                                Carefully review each section before submitting.
                                You will not be able to change this submission
                                while it is under review.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 text-sm">
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-base font-semibold">
                                        Step 1 — Profile
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Personal and contact information
                                    </p>
                                </div>
                                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                                    {[
                                        ['First name', draft.first_name],
                                        ['Middle name', draft.middle_name],
                                        ['Last name', draft.last_name],
                                        ['Date of birth', draft.date_of_birth],
                                        ['Gender', draft.gender],
                                        ['Nationality', draft.nationality],
                                        ['Mobile number', draft.phone_number],
                                        ['Email address', draft.email],
                                    ].map(([label, value]) => (
                                        <div key={String(label)}>
                                            <p className="text-muted-foreground font-medium">
                                                {label}
                                            </p>
                                            <p>
                                                {String(
                                                    value || 'Not provided',
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {files.profile_image && (
                                    <div className="space-y-2 rounded-lg border p-4">
                                        <p className="text-muted-foreground font-medium">
                                            Profile picture
                                        </p>
                                        <img
                                            src={URL.createObjectURL(
                                                files.profile_image,
                                            )}
                                            alt="Profile picture preview"
                                            className="size-28 rounded-full border object-cover"
                                        />
                                    </div>
                                )}
                            </section>
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-base font-semibold">
                                        Step 2 — Location
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Registered address and detected location
                                    </p>
                                </div>
                                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                                    {[
                                        [
                                            'House/Unit/Bldg/Floor',
                                            draft.house_unit_building,
                                        ],
                                        ['Street', draft.street],
                                        ['Barangay', draft.barangay],
                                        [
                                            'City / Municipality',
                                            draft.city_municipality,
                                        ],
                                        ['Province', draft.province],
                                        ['Region', draft.region],
                                        ['ZIP code', draft.zip_code],
                                        ['Latitude', draft.latitude],
                                        ['Longitude', draft.longitude],
                                    ].map(([label, value]) => (
                                        <div key={String(label)}>
                                            <p className="text-muted-foreground font-medium">
                                                {label}
                                            </p>
                                            <p>
                                                {String(
                                                    value || 'Not provided',
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <LocationMap
                                    latitude={
                                        typeof draft.latitude === 'number'
                                            ? draft.latitude
                                            : null
                                    }
                                    longitude={
                                        typeof draft.longitude === 'number'
                                            ? draft.longitude
                                            : null
                                    }
                                    googleMapsApiKey={googleMapsApiKey}
                                />
                            </section>
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-base font-semibold">
                                        Step 3 — Identity verification
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Government-issued ID and selfie
                                        confirmation
                                    </p>
                                </div>
                                <div className="space-y-4 rounded-lg border p-4">
                                    <p className="text-muted-foreground font-medium">
                                        ID type
                                    </p>
                                    <p>
                                        {String(
                                            draft.id_type || 'Not provided',
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-3 rounded-lg border p-4">
                                    <h4 className="font-semibold">Valid ID</h4>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            ['ID front', files.id_front_image],
                                            ['ID back', files.id_back_image],
                                        ].map(
                                            ([label, file]) =>
                                                file && (
                                                    <div
                                                        key={label as string}
                                                        className="space-y-2"
                                                    >
                                                        <p className="text-muted-foreground font-medium">
                                                            {label as string}
                                                        </p>
                                                        <img
                                                            src={URL.createObjectURL(
                                                                file as File,
                                                            )}
                                                            alt={`${label as string} preview`}
                                                            className="aspect-[4/3] w-full rounded-md border object-contain"
                                                        />
                                                    </div>
                                                ),
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 rounded-lg border p-4">
                                    <h4 className="font-semibold">
                                        Selfie capture
                                    </h4>
                                    {files.selfie_image && (
                                        <img
                                            src={URL.createObjectURL(
                                                files.selfie_image,
                                            )}
                                            alt="Selfie preview"
                                            className="aspect-[4/3] w-full max-w-sm rounded-md border object-contain"
                                        />
                                    )}
                                </div>
                            </section>
                            <div className="hidden">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {Object.entries(draft)
                                        .filter(
                                            ([key]) =>
                                                ![
                                                    'latitude',
                                                    'longitude',
                                                ].includes(key),
                                        )
                                        .map(([key, value]) => (
                                            <div key={key}>
                                                <span className="text-muted-foreground">
                                                    {key.replaceAll('_', ' ')}:
                                                </span>{' '}
                                                <span className="font-medium">
                                                    {String(value || '—')}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                                <LocationMap
                                    latitude={
                                        typeof draft.latitude === 'number'
                                            ? draft.latitude
                                            : null
                                    }
                                    longitude={
                                        typeof draft.longitude === 'number'
                                            ? draft.longitude
                                            : null
                                    }
                                />
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {[
                                        'profile_image',
                                        'id_front_image',
                                        'id_back_image',
                                        'selfie_image',
                                    ].map(
                                        (key) =>
                                            files[key] && (
                                                <img
                                                    key={key}
                                                    src={URL.createObjectURL(
                                                        files[key]!,
                                                    )}
                                                    alt={key.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                    className="max-h-48 w-full rounded-md border object-contain"
                                                />
                                            ),
                                    )}
                                </div>
                            </div>
                            <Dialog
                                open={confirmOpen}
                                onOpenChange={setConfirmOpen}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Submit merchant application?
                                        </DialogTitle>
                                        <DialogDescription>
                                            Please confirm that all information
                                            and uploaded images are accurate and
                                            readable. After submission, your
                                            application will be locked while
                                            Rapex Admin reviews it within a
                                            maximum of 24 hours.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex items-start gap-3 rounded-md border p-3">
                                        <Checkbox
                                            id="merchant-policies"
                                            checked={agreedToPolicies}
                                            onCheckedChange={(checked) =>
                                                setAgreedToPolicies(
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="merchant-policies"
                                            className="text-sm leading-5"
                                        >
                                            I agree to the merchant{' '}
                                            <button
                                                type="button"
                                                className="text-primary underline"
                                                onClick={() =>
                                                    setTermsOpen(true)
                                                }
                                            >
                                                Terms and Conditions
                                            </button>{' '}
                                            and acknowledge the{' '}
                                            <button
                                                type="button"
                                                className="text-primary underline"
                                                onClick={() =>
                                                    setPrivacyOpen(true)
                                                }
                                            >
                                                Privacy Policy
                                            </button>
                                            .
                                        </label>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setConfirmOpen(false)
                                            }
                                        >
                                            Review again
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={
                                                submitted || !agreedToPolicies
                                            }
                                            onClick={() => {
                                                setConfirmOpen(false);
                                                submit();
                                            }}
                                        >
                                            Confirm and submit
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Dialog
                                open={termsOpen}
                                onOpenChange={setTermsOpen}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Merchant Terms and Conditions
                                        </DialogTitle>
                                        <DialogDescription>
                                            By submitting an application, you
                                            confirm that the information and
                                            documents provided are accurate,
                                            current, and yours. You authorize
                                            Rapex to review them for merchant
                                            approval, and agree not to submit
                                            fraudulent, misleading, or
                                            unauthorized documents.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            onClick={() => setTermsOpen(false)}
                                        >
                                            Close
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Dialog
                                open={privacyOpen}
                                onOpenChange={setPrivacyOpen}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Merchant Privacy Policy
                                        </DialogTitle>
                                        <DialogDescription>
                                            Rapex collects the information,
                                            location, identity documents, and
                                            selfie provided in this application
                                            to verify merchant identity and
                                            eligibility. Information is stored
                                            privately, accessed only by
                                            authorized reviewers, and retained
                                            according to Rapex records and legal
                                            requirements.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                setPrivacyOpen(false)
                                            }
                                        >
                                            Close
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}
                <div className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={step === 1}
                        onClick={() => setStep((current) => current - 1)}
                    >
                        <ChevronLeft /> Back
                    </Button>
                    {step < 4 ? (
                        <Button
                            type="button"
                            disabled={
                                locating ||
                                (step === 2 &&
                                    (draft.latitude === null ||
                                        draft.longitude === null))
                            }
                            onClick={nextStep}
                        >
                            {step === 3 ? 'Review application' : 'Continue'}{' '}
                            <ChevronRight />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={submitted}
                            onClick={() => {
                                setAgreedToPolicies(false);
                                setConfirmOpen(true);
                            }}
                        >
                            {submitted ? 'Submitting application…' : 'Submit Merchant Application'}{' '}
                            <ChevronRight />
                        </Button>
                    )}
                </div>
            </main>
        </>
    );
}
