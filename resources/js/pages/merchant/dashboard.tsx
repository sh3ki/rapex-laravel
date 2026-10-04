import RoleDashboard from '@/components/role-dashboard';

export default function Page() { return <RoleDashboard role="merchant" />; }

Page.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};
