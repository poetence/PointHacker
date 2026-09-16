import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlaneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 21 12 17l1.5 4-1.5-1-1.5 1Z" />
      <path d="M12 17V5.5a2 2 0 0 1 3.5-1.3l.2.2a2 2 0 0 1 .5 1.3V11l4.6 2.9a1.2 1.2 0 0 1 .2 1.9l-.9.8-4-1.1-4 2" />
      <path d="M12 11 4.9 8.6a1.2 1.2 0 0 0-1.6 1.5l1.1 3 5-1.6" />
    </svg>
  );
}

export function HotelIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21V9l7-5 7 5v12" />
      <path d="M3 21h17" />
      <path d="M8 21v-5a2 2 0 0 1 4 0v5" />
      <path d="M10 9h.01M10 12h.01" />
    </svg>
  );
}

export function BankIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10h18" />
      <path d="M12 3 3 10h18L12 3Z" />
      <path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function CashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9v.01M18 15v.01" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 14a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
    </svg>
  );
}

export function CoinsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="9" cy="7" rx="6" ry="3.5" />
      <path d="M3 7v5c0 1.9 2.7 3.5 6 3.5s6-1.6 6-3.5V7" />
      <path d="M3 12v5c0 1.9 2.7 3.5 6 3.5 1.9 0 3.6-.5 4.8-1.3" />
      <ellipse cx="17" cy="14" rx="4.5" ry="2.7" />
      <path d="M12.5 14v3.3c0 1.5 2 2.7 4.5 2.7s4.5-1.2 4.5-2.7V14" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-3-1 2-5Z" />
    </svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.5c-1.5-1.3-3.6-2-6.5-2-.6 0-1 .4-1 1v11.5c0 .6.4 1 1 1 2.9 0 5 .7 6.5 2" />
      <path d="M12 6.5c1.5-1.3 3.6-2 6.5-2 .6 0 1 .4 1 1v11.5c0 .6-.4 1-1 1-2.9 0-5 .7-6.5 2Z" />
      <path d="M12 6.5V20" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function LogoMarkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="m12 2 0 20M3 7l9 5 9-5" />
    </svg>
  );
}
