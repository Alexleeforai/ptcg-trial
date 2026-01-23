import { ClerkProvider } from '@clerk/nextjs'
import "../globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Authentication",
    description: "Sign in or sign up",
};

export default function AuthLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`${geistSans.variable} ${geistMono.variable}`}>
                    <div className="flex min-h-screen flex-col items-center justify-center py-24">
                        {children}
                    </div>
                </body>
            </html>
        </ClerkProvider>
    )
}
