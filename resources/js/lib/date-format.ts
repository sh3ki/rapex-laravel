const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };

export const formatAdminDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-US', dateOptions) : '—';

export const formatAdminDateTime = (value?: string | null) => {
    if (!value) return { date: '—', time: '' };
    const date = new Date(value);
    return { date: date.toLocaleDateString('en-US', dateOptions), time: date.toLocaleTimeString('en-US', timeOptions) };
};
