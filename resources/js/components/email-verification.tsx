import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import SixDigitCodeInput from '@/components/six-digit-code-input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = { email?: string };

export default function EmailVerification({ email }: Props) {
    const [code, setCode] = useState('');

    return <>
        <Head title="Email verification" />
        <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">Verify your email address</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-medium text-foreground">{email ?? 'your email address'}</span>.</p>
        </div>
        <Form action="/email/verify-code" method="post" className="space-y-6">
            {({ processing, errors }) => <>
                <div className="grid gap-2">
                    <SixDigitCodeInput name="code" value={code} onChange={setCode} />
                    <p className="text-center text-xs text-muted-foreground">The code expires in 15 minutes.</p>
                    <InputError message={errors.code} />
                </div>
                <Button type="submit" disabled={processing || code.length !== 6} className="w-full">{processing && <Spinner />} Verify email</Button>
            </>}
        </Form>
        <Form action="/email/verification-notification" method="post" className="mt-3 text-center">
            {({ processing: resending }) => <Button type="submit" variant="ghost" disabled={resending} className="text-sm">{resending && <Spinner />} Resend code</Button>}
        </Form>
        <Form action="/logout" method="post" className="mt-4 text-center">
            <Button type="submit" variant="ghost" className="text-sm">Log out</Button>
        </Form>
    </>;
}
