import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  /** Title used by the native share sheet. Falls back to document title. */
  title?: string;
  /** Optional explicit URL to share. Defaults to the current page URL. */
  url?: string;
  /** Optional extra class names for the trigger button. */
  className?: string;
  /** Visible label next to the icon. Defaults to "Share". */
  label?: string;
}

/**
 * Share the current page. Uses the Web Share API when available
 * (mobile / supported browsers) and falls back to copying the link
 * to the clipboard with brief "Copied" feedback. Only the URL is
 * shared so copying never appends extra title/description text.
 */
export default function ShareButton({ title, url, className, label = 'Share' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const shareUrl = url ?? window.location.href;
    const shareTitle = title ?? document.title;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      className={`share-btn${className ? ` ${className}` : ''}`}
      onClick={onShare}
      aria-label={copied ? 'Link copied' : 'Share this page'}
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      <span>{copied ? 'Link copied' : label}</span>
    </button>
  );
}
