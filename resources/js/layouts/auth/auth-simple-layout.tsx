import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="bg-background flex min-h-svh w-full flex-col items-center justify-center p-4 sm:p-6 md:p-10">
            <div className="w-full max-w-lg">
                <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-lg sm:p-8">
                    <div className="flex flex-col items-center">
                        <Link
                            href={home()}
                            className="flex w-full items-center justify-center font-medium"
                        >
                            <div className="flex w-1/2 items-center justify-center">
                                <img
                                    src="/rapex-textured.png"
                                    alt="Rapex"
                                    className="h-auto w-full max-w-sm object-contain"
                                />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>
                    </div>
                    <div className="w-full">
                        {(title || description) && (
                            <div className="mb-6 space-y-2 text-center">
                                {title && <h1 className="text-xl font-medium">{title}</h1>}
                                {description && (
                                    <p className="text-muted-foreground text-sm">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
