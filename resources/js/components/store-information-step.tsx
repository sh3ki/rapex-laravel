import { ArrowDown, Clipboard, Plus, X } from 'lucide-react';
import { CameraCapture } from '@/components/camera-capture';
import { FileUpload } from '@/components/file-upload';
import PhoneNumberInput from '@/components/phone-number-input';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Draft } from '@/pages/merchant/stores';

export type StoreCreateFiles = {
    profile_image: File | null;
    banner_image: File | null;
    valid_id_front: File | null;
    valid_id_back: File | null;
    selfie: File | null;
    store_capture: File | null;
    documents: Record<string, File | null>;
    other_documents: Array<File | null>;
};

type Props = {
    draft: Draft;
    files: StoreCreateFiles;
    structures: readonly (readonly [string, string])[];
    registrations: readonly (readonly [string, string])[];
    merchantEmail?: string | null;
    merchantPhone?: string | null;
    update: (key: string, value: string | number | null) => void;
    saveFile: (key: keyof StoreCreateFiles | string, file: File | null) => void;
    addOtherDocument: () => void;
    error: (key: string) => React.ReactNode;
};

const idTypes = ['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', 'PRC ID', 'TIN ID', "Voter's ID", 'NBI Clearance', 'Other Government-Issued ID'];

function documentRequirements(registration: string, structure: string) {
    const certificate = structure === 'sole-proprietorship' ? 'DTI Certificate' : structure === 'cooperative' ? 'CDA Certificate' : 'SEC Certificate';
    if (registration === 'unregistered-microseller') return [{ key: 'proof_of_business_address', label: 'Proof of Business Address', required: true }];
    const required = [
        { key: 'barangay_permit', label: 'Barangay Permit', required: true },
        { key: 'business_certificate', label: certificate, required: true },
        { key: 'proof_of_business_address', label: 'Proof of Business Address', required: true },
    ];
    if (registration === 'vat-registration') required.push(
        { key: 'bir_certificate', label: 'BIR Certificate of Registration (Form 2303)', required: true },
        { key: 'mayors_business_permit', label: "Mayor's / Business Permit", required: true },
    ); else required.push(
        { key: 'bir_certificate', label: 'BIR Certificate of Registration (Form 2303)', required: false },
        { key: 'mayors_business_permit', label: "Mayor's / Business Permit", required: false },
    );
    return required;
}

export function StoreInformationStep({ draft, files, structures, registrations, merchantEmail, merchantPhone, update, saveFile, addOtherDocument, error }: Props) {
    const requirements = documentRequirements(String(draft.business_registration ?? ''), String(draft.business_structure ?? ''));
    const field = (key: string, label: string, type = 'text') => <div className="space-y-2"><Label htmlFor={key}>{label}<span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></Label><Input id={key} type={type} value={String(draft[key] ?? '')} onChange={(event) => update(key, event.target.value)} />{error(key)}</div>;

    return <section className="space-y-6"><div className="space-y-2"><CardTitle>Store Information</CardTitle><CardDescription>Provide business, owner verification, contact, and registration documents.</CardDescription></div>
        <div className="grid gap-4 sm:grid-cols-2">{[{ key: 'business_structure', label: 'Business structure', options: structures }, { key: 'business_registration', label: 'Business registration', options: registrations }].map(({ key, label, options }) => <div key={key} className="space-y-2"><Label htmlFor={key}>{label} *</Label><Select value={String(draft[key] ?? '')} onValueChange={(value) => update(key, value)}><SelectTrigger id={key} className="w-full"><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent></Select>{error(key)}</div>)}</div>
        <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="contact_email">Contact email *</Label><div className="flex gap-2"><Input id="contact_email" type="email" value={String(draft.contact_email ?? '')} onChange={(event) => update('contact_email', event.target.value)} />{merchantEmail && <Button type="button" size="icon" variant="outline" className="shrink-0" title="Use saved email" aria-label="Use saved email" onClick={() => update('contact_email', merchantEmail)}><span className="relative inline-flex"><Clipboard /><ArrowDown className="absolute -bottom-1 -right-1 size-3 bg-background stroke-[2.5]" /></span></Button>}</div>{error('contact_email')}</div><div className="space-y-2"><Label htmlFor="contact_mobile_phone">Mobile number *</Label><div className="flex gap-2"><PhoneNumberInput id="contact_mobile_phone" name="contact_mobile_phone" required value={String(draft.contact_mobile_phone ?? '')} onChange={(value) => update('contact_mobile_phone', value)} />{merchantPhone && <Button type="button" size="icon" variant="outline" className="shrink-0" title="Use saved mobile" aria-label="Use saved mobile" onClick={() => update('contact_mobile_phone', merchantPhone.replace(/^\+63/, ''))}><span className="relative inline-flex"><Clipboard /><ArrowDown className="absolute -bottom-1 -right-1 size-3 bg-background stroke-[2.5]" /></span></Button>}</div>{error('contact_mobile_phone')}</div>{field('contact_telephone', 'Telephone number', 'tel')}</div>
        <div className="space-y-4"><div><h3 className="font-semibold">Store owner verification</h3><p className="text-sm text-muted-foreground">Submit a valid ID, selfie, and store photo for verification.</p></div><div className="w-full space-y-2 md:w-1/2"><Label htmlFor="valid_id_type">Valid ID type *</Label><Select value={String(draft.valid_id_type ?? '')} onValueChange={(value) => update('valid_id_type', value)}><SelectTrigger id="valid_id_type" className="w-full"><SelectValue placeholder="Select ID type" /></SelectTrigger><SelectContent>{idTypes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>{error('valid_id_type')}</div><div className="grid gap-6 md:grid-cols-2"><CameraCapture label="Valid ID front" instruction="Place the front of your valid government-issued ID inside the frame." value={files.valid_id_front} onChange={(file) => saveFile('valid_id_front', file)} /><CameraCapture label="Valid ID back" instruction="Place the back of your valid government-issued ID inside the frame." value={files.valid_id_back} onChange={(file) => saveFile('valid_id_back', file)} /><CameraCapture label="Selfie" instruction="Center your face in the frame with good lighting." facingMode="user" value={files.selfie} onChange={(file) => saveFile('selfie', file)} /><CameraCapture label="Store image" instruction="Capture a clear photo of the store or storefront." value={files.store_capture} onChange={(file) => saveFile('store_capture', file)} /></div></div>
        <div className="space-y-4 rounded-lg border p-4"><div><h3 className="font-semibold">Business documents</h3><p className="text-sm text-muted-foreground">Accepted formats: image or PDF. Maximum 3 MB per file.</p></div><div className="grid gap-4 sm:grid-cols-2">{requirements.map((document) => <div key={document.key} className="space-y-2"><Label>{document.label}{document.required ? <span className="text-destructive"> *</span> : <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}</Label><FileUpload value={files.documents[document.key] ?? null} onChange={(file) => saveFile(`documents.${document.key}`, file)} /><div>{error(`documents.${document.key}`)}</div></div>)}<div className="space-y-2"><Label>Other Supporting Documents <span className="ml-1 text-xs font-normal text-muted-foreground">(optional, up to 3)</span></Label>{files.other_documents.map((file, index) => <div key={index} className="flex items-start gap-2"><div className="min-w-0 flex-1"><FileUpload value={file} onChange={(next) => saveFile(`other_documents.${index}`, next)} /></div>{index > 0 && <Button type="button" variant="ghost" size="icon" className="mt-1 size-7 shrink-0" onClick={() => saveFile(`other_documents.${index}`, null)} title="Remove supporting document slot" aria-label="Remove supporting document slot"><X /></Button>}</div>)}{files.other_documents.length < 3 && <Button type="button" variant="outline" onClick={addOtherDocument} title="Add supporting document"><Plus /> Add Supporting Document</Button>}</div></div></div>
    </section>;
}
