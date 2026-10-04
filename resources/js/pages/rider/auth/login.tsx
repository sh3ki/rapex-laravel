import RoleAuthForm from '@/components/auth/role-auth-form'; export default function Page({ role = 'rider' }: { role?: string }) { return <RoleAuthForm role={role} mode="login" />; }
