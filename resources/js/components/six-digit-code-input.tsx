import { useRef, useState } from 'react';

type Props = {
    name: string;
    value: string;
    onChange: (value: string) => void;
};

export default function SixDigitCodeInput({ name, value, onChange }: Props) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const [digits, setDigits] = useState<string[]>(() => Array.from({ length: 6 }, (_, index) => value[index] ?? ''));

    const updateDigit = (index: number, nextValue: string) => {
        const digit = nextValue.replace(/\D/g, '').slice(-1);
        const nextDigits = [...digits];
        nextDigits[index] = digit;
        setDigits(nextDigits);
        onChange(nextDigits.join(''));
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const clearDigit = (index: number) => {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        setDigits(nextDigits);
        onChange(nextDigits.join(''));
    };

    return <div className="flex justify-center gap-2 sm:gap-3">
        <input type="hidden" name={name} value={value} />
        {digits.map((digit, index) => <input
            key={index}
            ref={(element) => { inputRefs.current[index] = element; }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit.trim()}
            aria-label={`Verification code digit ${index + 1}`}
            onChange={(event) => updateDigit(index, event.currentTarget.value)}
            onKeyDown={(event) => {
                if (event.key === 'Backspace') {
                    event.preventDefault();
                    if (digit) {
                        clearDigit(index);
                    } else if (index > 0) {
                        clearDigit(index - 1);
                        inputRefs.current[index - 1]?.focus();
                    }
                }
            }}
            onPaste={(event) => {
                event.preventDefault();
                const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                const nextDigits = Array.from({ length: 6 }, (_, index) => pasted[index] ?? '');
                setDigits(nextDigits);
                onChange(pasted);
                inputRefs.current[Math.min(pasted.length, 5)]?.focus();
            }}
            className="size-11 rounded-md border bg-background text-center text-lg font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:size-12"
        />)}
    </div>;
}
