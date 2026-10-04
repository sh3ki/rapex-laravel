import EmailVerification from '@/components/email-verification';

export default function RoleVerifyEmail({ email }: { email?: string }) {
    return <EmailVerification email={email} />;
}
