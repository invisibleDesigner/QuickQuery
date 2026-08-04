import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function render({ size = 14, className, strokeWidth = 1.7 }: IconProps, children: React.ReactNode, filled = false) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`qq-icon${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const ChevronIcon = (p: IconProps) => render(p, <path d="M9 5.5 15.5 12 9 18.5" />);

export const ServerIcon = (p: IconProps) =>
  render(p, (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" strokeWidth={2.4} />
    </>
  ));

export const DatabaseIcon = (p: IconProps) =>
  render(p, (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
      <path d="M4.5 11.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    </>
  ));

export const TableIcon = (p: IconProps) =>
  render(p, (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M9.5 9.5v10M15.5 9.5v10" />
    </>
  ));

export const KeyIcon = (p: IconProps) =>
  render(p, (
    <>
      <circle cx="8.5" cy="12" r="4" />
      <path d="M12.5 12H21M18 12v3.5M15.5 12v2.5" />
    </>
  ));

export const FieldIcon = (p: IconProps) => render(p, <circle cx="12" cy="12" r="3.2" />, true);

export const PlusIcon = (p: IconProps) => render(p, <path d="M12 5v14M5 12h14" strokeWidth={p.strokeWidth ?? 2} />);

export const PencilIcon = (p: IconProps) =>
  render(p, (
    <>
      <path d="M14.5 5.5 18.5 9.5 8.5 19.5H4.5v-4L14.5 5.5Z" />
      <path d="m12.5 7.5 4 4" />
    </>
  ));

export const TrashIcon = (p: IconProps) =>
  render(p, (
    <>
      <path d="M4.5 6.5h15M9.5 6V4.8c0-.44.36-.8.8-.8h3.4c.44 0 .8.36.8.8V6" />
      <path d="M6.5 6.5 7.4 19c.03.55.49 1 1.04 1h7.12c.55 0 1.01-.45 1.04-1l.9-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </>
  ));

export const CloseIcon = (p: IconProps) => render(p, <path d="M6 6l12 12M18 6 6 18" strokeWidth={p.strokeWidth ?? 1.9} />);

export const PlayIcon = (p: IconProps) => render(p, <path d="M7.5 5.2c0-.94 1.03-1.51 1.82-1L18.4 11a1.2 1.2 0 0 1 0 2l-9.1 6.8c-.8.51-1.82-.06-1.82-1V5.2Z" />, true);

export const KeyboardIcon = (p: IconProps) =>
  render(p, (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M6 9.5h.01M10 9.5h.01M14 9.5h.01M18 9.5h.01M6 13h.01M18 13h.01M9 13h6" strokeWidth={2.2} />
    </>
  ));

export const RowsIcon = (p: IconProps) =>
  render(p, (
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
      <path d="M8.5 4v16" opacity={0.55} />
    </>
  ));

export const ClockIcon = (p: IconProps) =>
  render(p, (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ));

export const AlertIcon = (p: IconProps) =>
  render(p, (
    <>
      <path d="M10.7 4.1 2.9 17.6A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 1.4-2.4L13.3 4.1a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M12 9.5V14M12 17h.01" strokeWidth={2} />
    </>
  ));

export const CheckIcon = (p: IconProps) => render(p, <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth={2} />);

export const TerminalIcon = (p: IconProps) =>
  render(p, (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="m7 9.5 3 3-3 3M12.5 15.5H17" />
    </>
  ));

export const PlugIcon = (p: IconProps) =>
  render(p, (
    <>
      <path d="M9 7.5V3.5M15 7.5V3.5" />
      <path d="M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0v-3Z" />
      <path d="M12 16v4.5" />
    </>
  ));
