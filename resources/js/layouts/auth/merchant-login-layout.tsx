import { Head } from '@inertiajs/react';
import { ArrowRight, Headphones, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

export default function MerchantLoginLayout({ children }: { children: ReactNode }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <>
            <Head title="Merchant login" />
            <main className="merchant-login min-h-svh bg-[#f7f7fb] text-[#25243b] transition-colors dark:bg-[#10101a] dark:text-[#f8f7ff]">
                <div className="merchant-frame flex min-h-svh flex-col overflow-hidden bg-white dark:bg-[#171722]">
                    <header className="flex min-h-[82px] items-center justify-between gap-5 border-b border-[#e5e5ec] px-6 py-4 dark:border-white/10 sm:px-10 lg:px-[86px]">
                        <a href="/" className="flex shrink-0 items-center gap-5" aria-label="RAPEX home">
                            <span className="flex items-center gap-1"><img src="/Logo.png" alt="" className="h-10 w-10 object-contain" /><img src="/text-textured.png" alt="RAPEX" className="h-9 w-[88px] object-contain" /></span>
                            <span className="hidden h-8 w-px bg-[#d7d7df] sm:block dark:bg-white/20" />
                            <span className="hidden text-[15px] font-bold tracking-[0.18em] text-[#555466] sm:block dark:text-[#cbc9db]">MERCHANT CENTER</span>
                        </a>
                        <nav className="hidden items-center gap-10 text-sm font-semibold text-[#393846] lg:flex dark:text-[#d9d7e4]">
                            <a href="#home" className="text-[#7139df]">Home</a>
                            <a href="#how-it-works" className="hover:text-[#7139df]">How It Works</a>
                            <a href="#benefits" className="hover:text-[#7139df]">Benefits</a>
                            <a href="#resources" className="hover:text-[#7139df]">Resources</a>
                            <a href="#support" className="hover:text-[#7139df]">Support</a>
                            <span className="h-6 w-px bg-[#d7d7df] dark:bg-white/20" />
                            <a href="#support" className="flex items-center gap-2 rounded-xl border border-[#dedee7] px-4 py-2.5 hover:border-[#7139df] dark:border-white/15">
                                <Headphones className="size-4 text-[#7139df]" /> Contact Us
                            </a>
                        </nav>
                        <button
                            type="button"
                            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                            className="rounded-full border border-[#dedee7] p-2.5 text-[#7139df] transition hover:bg-[#f2edff] dark:border-white/15 dark:hover:bg-white/10"
                            aria-label={isDark ? 'Use light mode' : 'Use dark mode'}
                        >
                            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                        </button>
                    </header>

                    <div className="merchant-content relative grid flex-1 lg:grid-cols-[1.08fr_0.92fr]">
                        <div className="merchant-waves" aria-hidden="true" />
                        <div className="merchant-city" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                        <section id="home" className="merchant-hero relative overflow-hidden px-7 py-10 sm:px-12 lg:px-9 lg:py-12">
                            <div className="merchant-hero-glow" />
                            <div className="merchant-planes" aria-hidden="true"><span>➤</span><span>➤</span><span>➤</span></div>
                            <div className="relative z-10 max-w-[590px]">
                                <p className="mb-5 text-sm font-extrabold tracking-[0.34em] text-[#f06442]">DELIVERING THE FUTURE TODAY</p>
                                <h1 className="text-4xl font-extrabold leading-[1.12] tracking-[-0.03em] sm:text-5xl">Grow your local business<br />beyond your storefront.</h1>
                                <p className="mt-5 max-w-[520px] text-lg leading-7 text-[#686779] dark:text-[#b8b6c9]">Bring your store online, reach nearby customers, receive orders, and grow with the RAPEX local marketplace.</p>
                                <a href="/register" className="mt-6 inline-flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#ff8b36] via-[#f05270] to-[#a62bc5] px-7 py-3.5 text-base font-extrabold text-white shadow-[0_8px_18px_rgba(224,65,136,0.3)]">REGISTER NOW <ArrowRight className="size-5" /></a>

                                <div className="merchant-panel mt-5 rounded-2xl p-4 backdrop-blur">
                                    <div className="flex items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f3eaff] text-2xl dark:bg-[#7139df]/20">🚀</div><div><p className="text-sm leading-5 text-[#4d4b5c] dark:text-[#d0cedb]">Be one of the first RAPEX Merchant Pioneers and get<br className="hidden sm:block" /> early access to merchant benefits, promotions, and<br className="hidden sm:block" /> growth opportunities.</p><a href="#benefits" className="mt-1 inline-block text-sm font-bold text-[#7139df]">Become a Pioneer <ArrowRight className="ml-1 inline size-4" /></a></div></div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <Benefit value="2–50 KM" label="CUSTOMER VISIBILITY" text="Reach customers within your available delivery and service coverage." icon="⌖" />
                                    <Benefit value="24/7" label="MARKETPLACE VISIBILITY" text="Let customers discover your store anytime through RAPEX." icon="◷" />
                                    <Benefit value="1,000" label="PILOT USER TARGET" text="Initial customer goal for the RAPEX soft-launch community." icon="♟" />
                                    <Benefit value="1K+" label="POTENTIAL CUSTOMER REACH" text="Be visible to more nearby customers as the RAPEX network grows." icon="▥" />
                                </div>
                            </div>
                        </section>
                        <section className="relative z-10 flex items-start justify-center bg-transparent px-5 py-10 sm:px-10 lg:px-14 lg:py-7">
                            <div className="merchant-card w-full max-w-[555px] rounded-[30px] border border-[#e9e8ef] bg-white p-7 shadow-[0_15px_35px_rgba(36,35,60,0.12)] dark:border-white/10 dark:bg-[#232331] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)] sm:p-10">
                                {children}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}

function Benefit({ value, label, text, icon }: { value: string; label: string; text: string; icon: string }) {
    return <div className="merchant-panel rounded-2xl p-4"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f0e8ff] text-xl text-[#7139df] shadow-[inset_0_1px_3px_rgba(113,57,223,.08)] dark:bg-[#7139df]/20">{icon}</span><div><strong className="block text-xl leading-none">{value}</strong><span className="mt-1 block text-[10px] font-extrabold tracking-[0.08em] text-[#514f5e] dark:text-[#c9c7d5]">{label}</span><p className="mt-2 text-[11px] leading-4 text-[#686779] dark:text-[#aaa8bb]">{text}</p></div></div></div>;
}
