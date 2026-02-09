import React from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';

interface UserAvatarProps {
    src?: string | null;
    firstName?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'circle' | 'square';
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    src,
    firstName,
    className = '',
    size = 'md',
    variant = 'circle'
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-lg',
        lg: 'w-12 h-12 text-xl',
        xl: 'w-24 h-24 text-4xl'
    };

    const variantClasses = variant === 'circle' ? 'rounded-full' : 'rounded-xl';

    return (
        <div className={`relative overflow-hidden flex items-center justify-center shrink-0 ${sizeClasses[size]} ${variantClasses} ${className}`}>
            {src ? (
                <Image
                    src={src}
                    alt={firstName || 'User'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-current opacity-10 absolute inset-0" />
            )}
            {!src && (
                <span className="relative z-10 font-bold uppercase">
                    {firstName?.charAt(0) || <User className="w-1/2 h-1/2" />}
                </span>
            )}
        </div>
    );
};

export default UserAvatar;
