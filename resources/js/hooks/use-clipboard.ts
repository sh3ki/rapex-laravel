// Credit: https://usehooks-ts.com/
import { useState } from 'react';
import { notify } from '@/lib/toast';

export type CopiedValue = string | null;
export type CopyFn = (text: string) => Promise<boolean>;
export type UseClipboardReturn = [CopiedValue, CopyFn];

export function useClipboard(): UseClipboardReturn {
    const [copiedText, setCopiedText] = useState<CopiedValue>(null);

    const copy: CopyFn = async (text) => {
        if (!navigator?.clipboard) {
            notify.error('Copying is not supported by this browser.');

            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);

            return true;
        } catch {
            notify.error('Unable to copy. Please try again.');
            setCopiedText(null);

            return false;
        }
    };

    return [copiedText, copy];
}
