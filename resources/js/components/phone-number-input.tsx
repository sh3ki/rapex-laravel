import { Input } from '@/components/ui/input';

type Props = {
    id?: string;
    name: string;
    required?: boolean;
    autoFocus?: boolean;
    value?: string;
    onChange?: (value: string) => void;
};

export default function PhoneNumberInput({ id, name, required = false, autoFocus = false, value, onChange }: Props) {
    return <div className="flex">
        <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+63</span>
        <Input
            id={id}
            name={name}
            type="tel"
            required={required}
            autoFocus={autoFocus}
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            pattern="9[0-9]{9}"
            placeholder="9171234567"
            aria-label="Philippine mobile number without country code"
            value={value}
            onChange={(event) => {
                const digits = event.currentTarget.value.replace(/\D/g, '').slice(0, 10);
                event.currentTarget.value = digits;
                onChange?.(digits);
            }}
            className="rounded-l-none"
        />
    </div>;
}
