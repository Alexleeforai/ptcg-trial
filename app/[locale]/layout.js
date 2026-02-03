import { NextIntlClientProvider } from 'next-intl';
import { ClerkProvider } from '@clerk/nextjs';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "../globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: 'swap',
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: 'swap',
});

export const metadata = {
    title: "Pokemon TCG HK | Price & Stock",
    description: "Real-time Pokemon TCG prices and stock availability in Hong Kong.",
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default async function LocaleLayout({ children, params }) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!['en', 'ja', 'zh-CN', 'zh-HK'].includes(locale)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <ClerkProvider>
                    <NextIntlClientProvider messages={messages}>
                        <Header />
                        <main style={{ minHeight: '80vh' }}>
                            {children}
                        </main>
                        <Footer />
                    </NextIntlClientProvider>
                </ClerkProvider>
            </body>
        </html>
    );
}
