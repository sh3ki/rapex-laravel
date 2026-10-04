// Components
import EmailVerification from '@/components/email-verification';

export default function VerifyEmail({ email }: { email?: string }) {
    return <EmailVerification email={email} />;
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
