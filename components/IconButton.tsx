"use client";

import Icon, { type IconName } from "./Icons";

export default function IconButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  size = 16,
  ghostWhenIdle = false,
}: {
  icon: IconName;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  ghostWhenIdle?: boolean;
}) {
  return (
    <button
      className={`icon-btn${active ? " on" : ""}${ghostWhenIdle ? " ghost" : ""}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
