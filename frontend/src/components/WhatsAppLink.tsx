import React from 'react';
import { formatWhatsAppLink } from '@/lib/utils';

interface WhatsAppLinkProps {
  phone?: string | null;
  className?: string;
  showIcon?: boolean;
  iconSize?: number;
}

export default function WhatsAppLink({ phone, className = '', showIcon = true, iconSize = 14 }: WhatsAppLinkProps) {
  if (!phone) return <span>-</span>;
  const link = formatWhatsAppLink(phone);
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-[var(--color-primary)] font-semibold hover:underline ${className}`}
    >
      {showIcon && (
        <svg className="text-green-500 fill-current shrink-0" width={iconSize} height={iconSize} viewBox="0 0 24 24">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.918 9.918 0 0 0 4.779 1.218h.004c5.505 0 9.989-4.478 9.99-9.984A9.992 9.992 0 0 0 12.012 2zm5.727 14.13c-.25.707-1.442 1.328-1.996 1.382-.504.05-1.016.08-2.246-.388-1.748-.665-2.872-2.437-2.96-2.555-.088-.117-.768-.983-.768-1.932 0-.95.497-1.414.673-1.61.176-.197.382-.246.508-.246.126 0 .25.002.358.006.111.004.262-.043.41-.396.152-.36.52-1.268.566-1.36.046-.093.076-.201.015-.322-.061-.121-.274-.298-.41-.453-.137-.156-.288-.31-.41-.482-.125-.174-.263-.075-.36.03-.092.099-.396.388-.396.947 0 .559.407 1.099.464 1.175.058.077.8 1.22 1.938 1.71.271.117.483.187.649.24.272.086.52.074.715.045.217-.033.673-.275.768-.541.094-.266.094-.495.066-.541-.03-.046-.111-.077-.23-.137z" />
        </svg>
      )}
      <span>{phone}</span>
    </a>
  );
}
