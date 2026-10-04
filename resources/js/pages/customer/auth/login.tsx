import RoleAuthForm from '@/components/auth/role-auth-form'; export default function Page({ role = 'customer' }: { role?: string }) { return <RoleAuthForm role={role} mode="login" />; }
