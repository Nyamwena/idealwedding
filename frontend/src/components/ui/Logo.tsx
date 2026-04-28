'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
    const sizes = {
        sm: 140,
        md: 200,
        lg: 260,
    };

    return (
        <Link href="/" className={className}>
            <Image
                src="/logo.png"
                alt="Ideal Weddings Logo"
                width={sizes[size]}
                height={sizes[size] * 0.4}
                priority
            />
        </Link>
    );
}