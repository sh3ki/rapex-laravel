import RoleAuthForm from '@/components/auth/role-auth-form'; export default function Page({ role = 'merchant' }: { role?: string }) { return <RoleAuthForm role={role} mode="forgot" />; }
