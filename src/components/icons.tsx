import type { ReactNode, SVGProps } from "react";

interface IconProps {
  className?: string;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Svg({
  className = "h-5 w-5",
  children,
  ...rest
}: { className?: string; children: ReactNode } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} {...rest}>
      {children}
    </svg>
  );
}

export function IconCart({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 4h2.2l2.3 11.4a1.8 1.8 0 0 0 1.8 1.4h7.6a1.8 1.8 0 0 0 1.8-1.4L20.5 8H6" />
      <circle cx="9.7" cy="20" r="1.4" />
      <circle cx="17.3" cy="20" r="1.4" />
    </Svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20.5 20.5L16.5 16.5" />
    </Svg>
  );
}

export function IconStar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />
    </Svg>
  );
}

export function IconStarFilled({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} fill="currentColor">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconMinus({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.9 11.6A2 2 0 0 0 9.4 20.5h5.2a2 2 0 0 0 2-1.9L17.5 7" />
    </Svg>
  );
}

export function IconPencil({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L7.5 18.9 3.5 20l1.1-4 11.9-12.1z" />
      <path d="M14.5 5.9l3 3" />
    </Svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 9.5l6 6 6-6" />
    </Svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9.5 6l6 6-6 6" />
    </Svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function IconArrowLeft({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M19.5 12h-15M10.5 18l-6-6 6-6" />
    </Svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 12.5l5 5L19.5 6.5" />
    </Svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
    </Svg>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 7.5l9 6 9-6" />
    </Svg>
  );
}

export function IconMapPin({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 21.5S5 16.1 5 10.4a7 7 0 1 1 14 0c0 5.7-7 11.1-7 11.1z" />
      <circle cx="12" cy="10.3" r="2.5" />
    </Svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c1.4-3.4 4.2-5.2 7.5-5.2s6.1 1.8 7.5 5.2" />
    </Svg>
  );
}

export function IconLogOut({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Svg>
  );
}

export function IconExternal({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 13.5V18a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 4 18V9a2.5 2.5 0 0 1 2.5-2.5H11" />
    </Svg>
  );
}

export function IconGrid({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Svg>
  );
}

export function IconPackage({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M20.5 7.8v8.4L12 21l-8.5-4.8V7.8L12 3l8.5 4.8z" />
      <path d="M3.7 8L12 12.7 20.3 8M12 12.7V21" />
      <path d="M7.8 5.2l8.4 4.7" />
    </Svg>
  );
}

export function IconTag({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M20.6 13.4l-7.8 7.8a2 2 0 0 1-2.8 0l-6.4-6.4A2 2 0 0 1 3 13.4V5.5A2.5 2.5 0 0 1 5.5 3h7.9a2 2 0 0 1 1.4.6l5.8 5.8a2 2 0 0 1 0 2.8l-.001.001z" />
      <circle cx="8" cy="8" r="1.4" />
    </Svg>
  );
}

export function IconImage({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.7" cy="9.5" r="1.6" />
      <path d="M3.5 17l4.5-4.2 3.7 3.4 4.3-4 4.5 4.1" />
    </Svg>
  );
}

export function IconFileText({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Svg>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 6.5h10.5v9H3zM13.5 9.5H17l3.5 3.5v2.5h-7" />
      <circle cx="7" cy="18" r="1.9" />
      <circle cx="17" cy="18" r="1.9" />
    </Svg>
  );
}

export function IconAlert({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V13M12 16.4h.01" />
    </Svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3l8 3v5.8c0 4.5-3.3 8-8 9.2-4.7-1.2-8-4.7-8-9.2V6l8-3z" />
      <path d="M8.8 12.2l2.3 2.3 4.1-4.4" />
    </Svg>
  );
}

export function IconStore({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 9.5L5.5 4h13L20 9.5M4.5 9.5v10h15v-10" />
      <path d="M4 9.5a2.8 2.8 0 0 0 5.3 0 2.8 2.8 0 0 0 5.4 0 2.8 2.8 0 0 0 5.3 0" />
      <path d="M9.5 19.5v-5h5v5" />
    </Svg>
  );
}

/** Official-ish WhatsApp glyph (filled). */
export function IconWhatsApp({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-5 w-5"}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.7c-5.1 0-9.3 4.2-9.3 9.3 0 1.6.4 3.2 1.2 4.5L2.5 21.5l5.1-1.3c1.3.7 2.7 1.1 4.4 1.1 5.1 0 9.3-4.2 9.3-9.3S17.1 2.7 12 2.7zm0 16.9c-1.5 0-2.9-.4-4.1-1.2l-.3-.2-3 .8.8-2.9-.2-.3A7.5 7.5 0 1 1 12 19.6zm4.3-5.6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.2 6.2 0 0 1-3.1-2.7c-.2-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.4-.1-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z" />
    </svg>
  );
}
