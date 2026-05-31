import type { MessageStatus } from '../../types/message';

interface MessageStatusIconProps {
  status: MessageStatus;
}

function getIconPath(status: MessageStatus): string | null {
  const normalized = status.toLowerCase();
  if (normalized === 'read') return '/icons/double_check.svg';
  if (normalized === 'sent') return '/icons/check.svg';
  if (normalized === 'delivered') return '/icons/double_check_grey.svg';
  if (normalized === 'delivering' || normalized === 'queued') return null;
  if (normalized === 'receiving' || normalized === 'received') return null;
  return '/icons/close.svg';
}

export function MessageStatusIcon({ status }: MessageStatusIconProps) {
  const iconPath = getIconPath(status);
  if (!iconPath) return null;

  return (
    <img
      className="message-status-icon"
      src={iconPath}
      width={16}
      height={16}
      alt=""
      aria-hidden
    />
  );
}
