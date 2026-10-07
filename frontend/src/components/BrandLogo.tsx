import { brand } from '../config/catalog';

interface BrandLogoProps {
    dark: boolean;
    className?: string;
}

export default function BrandLogo({ dark, className = '' }: BrandLogoProps) {
    return (
        <img
            src={dark ? brand.logoDark : brand.logo}
            alt="Motorfort"
            className={`w-auto object-contain ${className}`}
        />
    );
}
