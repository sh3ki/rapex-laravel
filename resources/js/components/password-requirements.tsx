import { Circle, CircleCheck } from 'lucide-react';

type Props = { value: string };

const requirements = [
    { label: 'Minimum 8 characters', test: (value: string) => value.length >= 8 },
    { label: 'At least 1 uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
    { label: 'At least 1 lowercase letter', test: (value: string) => /[a-z]/.test(value) },
    { label: 'At least 1 number', test: (value: string) => /\d/.test(value) },
    { label: 'At least 1 special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export default function PasswordRequirements({ value }: Props) {
    return <ul className="mt-2 grid gap-1 text-xs text-muted-foreground" aria-label="Password requirements">
        {requirements.map(({ label, test }) => {
            const fulfilled = test(value);
            const Icon = fulfilled ? CircleCheck : Circle;

            return <li key={label} className={fulfilled ? 'flex items-center gap-2 text-emerald-600 dark:text-emerald-400' : 'flex items-center gap-2'}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
            </li>;
        })}
    </ul>;
}
