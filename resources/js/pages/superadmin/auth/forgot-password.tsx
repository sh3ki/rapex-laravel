import RoleAuthForm from '@/components/auth/role-auth-form'; export default function Page({ role = 'superadmin' }: { role?: string }) { return <RoleAuthForm role={role} mode="forgot" />; }
