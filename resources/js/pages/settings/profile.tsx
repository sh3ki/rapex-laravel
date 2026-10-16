import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';
import { useState } from 'react';

type MerchantProfile = { merchant: Record<string, any>; application: Record<string, any> | null; idType?: string | null; media: Record<string, string | null>; pendingEdits: { field: string; requested_at: string }[] };
type PageProps = { auth: Auth; merchantProfile?: MerchantProfile };
const fields = [['date_of_birth', 'Date of birth'], ['gender', 'Gender'], ['nationality', 'Nationality'], ['house_unit_building', 'House / unit / building'], ['street', 'Street'], ['barangay', 'Barangay'], ['city_municipality', 'City / municipality'], ['province', 'Province'], ['region', 'Region'], ['zip_code', 'ZIP code'], ['latitude', 'Latitude'], ['longitude', 'Longitude'], ['id_type', 'ID type']] as const;
const idTypeOptions = ['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', 'PRC ID', 'TIN ID', "Voter's ID", 'NBI Clearance', 'Other Government-Issued ID'];

export default function Profile({ mustVerifyEmail }: { mustVerifyEmail: boolean }) {
    const { auth, merchantProfile } = usePage<PageProps>().props;
    if (merchantProfile) return <MerchantProfileForm profile={merchantProfile} />;
    return <><Head title="Profile settings" /><h1 className="sr-only">Profile settings</h1><div className="space-y-6"><Heading variant="small" title="Profile" description="Update your name and email address" /><Form {...ProfileController.update.form()} options={{ preserveScroll: true }} className="space-y-6">{({ processing, errors }) => <><div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" defaultValue={auth.user.name} name="name" required autoComplete="name" /><InputError message={errors.name} /></div><div className="grid gap-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" defaultValue={auth.user.email} name="email" required autoComplete="username" /><InputError message={errors.email} /></div>{mustVerifyEmail && auth.user.email_verified_at === null && <p className="text-muted-foreground text-sm">Your email address is unverified. <Link href={send()} as="button" className="text-foreground underline">Click here to re-send the verification email.</Link></p>}<Button disabled={processing}>Save</Button></>}</Form></div><DeleteUser /></>;
}

function MerchantProfileForm({ profile }: { profile: MerchantProfile }) {
    const [editing, setEditing] = useState(false);
    const value = (field: string) => profile.merchant[field] ?? profile.application?.[field] ?? '';
    const idType = String(profile.idType || profile.application?.id_type || '').trim();
    const selectedIdType = idTypeOptions.find((option) => option.toLocaleLowerCase() === idType.toLocaleLowerCase()) ?? idType;
    return <><Head title="Merchant profile settings" /><h1 className="sr-only">Merchant profile settings</h1><div className="mx-auto max-w-6xl space-y-6"><div className="flex items-start justify-between gap-4"><Heading variant="small" title="Merchant profile" description="Update your onboarding information. All changes require admin approval." /><Button type="button" variant="outline" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'}</Button></div><div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Changes are pending until an administrator approves them.</div><Form {...ProfileController.update.form()} encType="multipart/form-data" options={{ preserveScroll: true }} className="space-y-8">{({ processing, errors }) => <><section className="space-y-4"><h2 className="text-lg font-semibold">Personal information</h2><ImageField field="profile_image" label="Profile image" current={profile.media.profile_image} errors={errors} disabled={!editing} circle /><div className="grid items-start gap-4 sm:grid-cols-3">{[['first_name', 'First name'], ['middle_name', 'Middle name'], ['last_name', 'Last name'], ['email', 'Email'], ['phone_number', 'Phone number']].map(([field, label]) => <Field key={field} field={field} label={label} value={value(field)} errors={errors} disabled={!editing} />)}{fields.slice(0, 3).map(([field, label]) => field === 'gender' ? <SelectField key={field} field={field} label={label} value={value(field)} errors={errors} disabled={!editing} options={['male', 'female', 'non-binary', 'other', 'prefer-not-to-say']} /> : <Field key={field} field={field} label={label} value={value(field)} errors={errors} disabled={!editing} />)}</div></section><section className="space-y-4"><h2 className="text-lg font-semibold">Address</h2><div className="grid gap-4 sm:grid-cols-3">{fields.slice(3, 12).map(([field, label]) => <Field key={field} field={field} label={label} value={value(field)} errors={errors} disabled={!editing} />)}</div></section><section className="space-y-4"><h2 className="text-lg font-semibold">ID &amp; selfie</h2><div className="max-w-sm"><SelectField key={`id-type-${selectedIdType}`} field="id_type" label="ID type" value={selectedIdType} errors={errors} disabled={!editing} options={idTypeOptions} /></div><div className="grid gap-4 sm:grid-cols-3">{[['id_front_image', 'ID front'], ['id_back_image', 'ID back'], ['selfie_image', 'Selfie']].map(([field, label]) => <ImageField key={field} field={field} label={label} current={profile.media[field]} errors={errors} disabled={!editing} />)}</div></section><div className="flex items-center gap-3"><Button disabled={processing || !editing}>{processing ? 'Submitting…' : 'Submit changes for approval'}</Button>{profile.pendingEdits.length > 0 && <span className="text-sm text-amber-600">Pending admin review</span>}</div></>}</Form></div></>;
}

function Field({ field, label, value, errors, disabled = false }: { field: string; label: string; value: any; errors: Record<string, string>; disabled?: boolean }) { return <div className="grid gap-2"><Label htmlFor={field}>{label}</Label><Input id={field} name={field} type={field === 'date_of_birth' ? 'date' : 'text'} defaultValue={value} disabled={disabled} /><InputError message={errors[field]} /></div>; }
function SelectField({ field, label, value, errors, disabled, options }: { field: string; label: string; value: any; errors: Record<string, string>; disabled: boolean; options: string[] }) { return <div className="grid gap-2"><Label htmlFor={field}>{label}</Label><select id={field} name={field} defaultValue={value} disabled={disabled} className={`border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2 ${disabled ? 'text-muted-foreground opacity-70' : 'text-foreground'}`}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><InputError message={errors[field]} /></div>; }
function ImageField({ field, label, current, errors, disabled, circle = false }: { field: string; label: string; current: string | null; errors: Record<string, string>; disabled: boolean; circle?: boolean }) {
    const [preview, setPreview] = useState(current);
    const [file, setFile] = useState<File | null>(null);

    if (circle) {
        return <div className="grid w-fit gap-2"><Label htmlFor={field}>{label}</Label><ProfileImageUpload name={field} value={file} initialPreview={preview ?? ''} onChange={(next) => { setFile(next); setPreview(next ? URL.createObjectURL(next) : current); }} disabled={disabled} align="start" /><InputError message={errors[field]} /></div>;
    }

    return <div className="grid gap-2"><Label htmlFor={field}>{label}</Label>{current ? <img src={current} alt={`${label} preview`} className="h-40 w-full rounded-md border object-cover" /> : <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">No saved image</div>}<Input id={field} name={field} type="file" accept="image/*" disabled={disabled} /><InputError message={errors[field]} /></div>;
}
Profile.layout = { breadcrumbs: [{ title: 'Profile settings', href: edit() }] };
