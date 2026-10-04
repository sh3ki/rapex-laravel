import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PasswordRequirements from '@/components/password-requirements';
import PhoneNumberInput from '@/components/phone-number-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import type { ChangeEventHandler, ReactNode } from 'react';
import { useState } from 'react';

type Props = { role: string; mode: 'login' | 'register' | 'forgot' | 'reset'; token?: string; email?: string; passwordRules?: string };

export default function RoleAuthForm({ role, mode, token, email, passwordRules }: Props) {
    const [password, setPassword] = useState('');
    const merchantLogin = role === 'merchant' && mode === 'login';
    const title = mode === 'login' ? `Log in as ${role}` : mode === 'register' ? `Apply as a ${role}` : mode === 'forgot' ? 'Forgot password' : 'Reset password';
    const action = mode === 'login' ? '/login' : mode === 'register' ? '/register' : mode === 'forgot' ? '/forgot-password' : '/reset-password';
    const registrationLabel = role === 'merchant' ? 'Apply as a merchant' : role === 'rider' ? 'Apply as a rider' : 'Create an account';
    const canRegister = ['customer', 'merchant', 'rider'].includes(role);
    const submitLabel = mode === 'login' ? 'Log in' : mode === 'register' ? registrationLabel : mode === 'forgot' ? 'Email reset link' : 'Reset password';
    const roleLabel = role[0].toUpperCase() + role.slice(1);
    const heading = mode === 'login' ? `${roleLabel} login` : mode === 'register' ? registrationLabel : title;
    const description = mode === 'login' ? `Sign in to your RAPEX ${role} account.` : mode === 'register' ? role === 'customer' ? 'Create your customer account.' : `Submit your application for a ${role} account.` : undefined;

    if (merchantLogin) return <MerchantLoginForm action={action} />;

    return <>
        <Head title={title} />
        <div className="mb-6 text-center"><h1 className="text-2xl font-semibold">{heading}</h1>{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}</div>
        <Form action={action} method="post" transform={(data) => mode === 'reset' ? { ...data, token, email } : data} resetOnSuccess={['password', 'password_confirmation']} disableWhileProcessing className="flex w-full flex-col gap-6">
            {({ processing, errors }) => <>
                {mode === 'forgot' && <div className="grid gap-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" name="email" autoFocus /><InputError message={errors.email} /></div>}
                {mode === 'reset' && <><div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" value={email} readOnly /><InputError message={errors.email} /></div><PasswordField name="password" label="Password" rules={passwordRules} error={errors.password} /><PasswordField name="password_confirmation" label="Confirm password" rules={passwordRules} error={errors.password_confirmation} /></>}
                {mode === 'login' && <><div className="grid gap-2"><Label htmlFor="email">Email address <RequiredMark /></Label><Input id="email" type="email" name="email" placeholder="you@example.com" required autoFocus /><InputError message={errors.email} /></div><PasswordField name="password" label="Password" placeholder="Enter your password" requiredMark error={errors.password} /><div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="remember" /> Remember me</label><Link href="/forgot-password" className="underline">Forgot password?</Link></div></>}
                {mode === 'register' && <><div className="grid gap-2"><Label htmlFor="first_name">First name <RequiredMark /></Label><Input id="first_name" name="first_name" placeholder="Enter your first name" required autoFocus autoComplete="given-name" /><InputError message={errors.first_name} /></div><div className="grid gap-2"><Label htmlFor="middle_name">Middle name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="middle_name" name="middle_name" placeholder="Enter your middle name" autoComplete="additional-name" /><InputError message={errors.middle_name} /></div><div className="grid gap-2"><Label htmlFor="last_name">Last name <RequiredMark /></Label><Input id="last_name" name="last_name" placeholder="Enter your last name" required autoComplete="family-name" /><InputError message={errors.last_name} /></div><div className="grid gap-2"><Label htmlFor="email">Email address <RequiredMark /></Label><Input id="email" type="email" name="email" placeholder="you@example.com" required /><InputError message={errors.email} /></div>{['customer', 'merchant', 'rider'].includes(role) && <div className="grid gap-2"><Label htmlFor="phone_number">Mobile number <RequiredMark /></Label><PhoneNumberInput id="phone_number" name="phone_number" required /><InputError message={errors.phone_number} /></div>}<PasswordField name="password" label="Password" placeholder="Create a secure password" requiredMark rules={passwordRules} error={errors.password} onChange={(event) => setPassword(event.currentTarget.value)} /> <PasswordRequirements value={password} /><PasswordField name="password_confirmation" label="Confirm password" placeholder="Re-enter your password" requiredMark rules={passwordRules} error={errors.password_confirmation} /></>}
                <Button type="submit" disabled={processing} className="w-full">{processing && <Spinner />} {submitLabel}</Button>
                {mode === 'login' && canRegister && <><div className="relative my-1 text-center text-xs text-muted-foreground"><span className="bg-background px-2">or</span><div className="absolute inset-x-0 top-1/2 -z-10 border-t" /></div><Button type="button" variant="outline" className="w-full" onClick={() => { window.location.href = '/auth/google'; }}>Continue with Google</Button></>}
                {mode === 'login' && canRegister && <div className="text-center text-sm">Doesn't have an account?{' '}<Link href="/register" className="underline">{registrationLabel}</Link></div>}
                {mode !== 'login' && <div className="text-center text-sm"><Link href="/login" className="underline">Return to login</Link></div>}
            </>}
        </Form>
    </>;
}

function MerchantLoginForm({ action }: { action: string }) {
    return <>
        <div className="mb-6"><p className="text-sm font-extrabold tracking-[0.25em] text-[#7139df]">MERCHANT PORTAL</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">Welcome back</h1><p className="mt-2 text-sm text-[#686779] dark:text-[#b8b6c9]">New to RAPEX? <a href="/register" className="font-bold text-[#7139df]">Create your merchant account</a></p></div>
        <Form action={action} method="post" disableWhileProcessing className="space-y-5">
            {({ processing, errors }) => <>
                <MerchantField id="email" label="Business email" type="email" placeholder="business@example.com" requiredMark icon={<Mail className="size-5" />} error={errors.email} />
                <MerchantField id="password" label="Password" type="password" placeholder="Enter your password" requiredMark icon={<LockKeyhole className="size-5" />} error={errors.password} />
                <button type="submit" disabled={processing} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff8b36] via-[#f05270] to-[#a62bc5] text-lg font-extrabold text-white shadow-[0_8px_18px_rgba(224,65,136,0.28)] transition hover:brightness-105 disabled:opacity-60">{processing && <Spinner />} Sign in to Merchant Center <ArrowRight className="size-6" /></button>
                <div className="grid grid-cols-2 gap-4"><a href="/register" className="flex h-14 items-center justify-center rounded-xl border border-[#e2e1e9] text-sm font-bold shadow-sm hover:bg-[#f8f7fb] dark:border-white/10 dark:hover:bg-white/10">Create Account</a><button type="button" onClick={() => { window.location.href = '/auth/google'; }} className="flex h-14 items-center justify-center gap-3 rounded-xl border border-[#e2e1e9] text-sm font-bold shadow-sm hover:bg-[#f8f7fb] dark:border-white/10 dark:hover:bg-white/10"><span className="text-lg font-extrabold text-[#4285f4]">G</span> Sign up with Google</button></div>
                <div className="flex items-center gap-4 rounded-2xl bg-[#faf8ff] p-4 dark:bg-[#2d2940]"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#eadcff] text-[#7139df] dark:bg-[#7139df]/25"><ShieldCheck className="size-7" /></div><div><p className="text-sm font-bold text-[#7139df]">Secure merchant access</p><p className="mt-1 text-xs text-[#686779] dark:text-[#bbb8c9]">Your session is protected by RAPEX authentication.</p></div><CheckCircle2 className="ml-auto hidden size-5 text-[#7139df] sm:block" /></div>
            </>}
        </Form>
    </>;
}

function MerchantField({ id, label, type, placeholder, requiredMark = false, icon, error }: { id: string; label: string; type: string; placeholder: string; requiredMark?: boolean; icon: ReactNode; error?: string }) {
    return <div className="grid gap-2"><Label htmlFor={id} className="text-sm font-bold">{label} {requiredMark && <RequiredMark />}</Label><div className="relative"><Input id={id} type={type} name={id} placeholder={placeholder} required autoComplete={id === 'email' ? 'email' : 'current-password'} className="h-14 rounded-xl border-[#e4e3eb] bg-[#fcfcfe] px-4 pr-12 text-sm shadow-[0_5px_15px_rgba(40,40,70,0.06)] dark:border-white/10 dark:bg-white/[0.04]" /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#9998a5]">{icon}</span></div><InputError message={error} /></div>;
}

function PasswordField({ name, label, placeholder, requiredMark = false, rules, error, onChange }: { name: string; label: string; placeholder?: string; requiredMark?: boolean; rules?: string; error?: string; onChange?: ChangeEventHandler<HTMLInputElement> }) {
    return <div className="grid gap-2"><Label htmlFor={name}>{label} {requiredMark && <RequiredMark />}</Label><PasswordInput id={name} name={name} placeholder={placeholder} required passwordrules={rules} onChange={onChange} /><InputError message={error} /></div>;
}

function RequiredMark() {
    return <span className="text-destructive" aria-hidden="true">*</span>;
}
