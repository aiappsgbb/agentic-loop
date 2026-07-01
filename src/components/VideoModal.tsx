import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
}

export default function VideoModal({ open, onClose, videoSrc, title }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    
    // Remember what had focus so we can restore it when the modal closes.
    triggerRef.current = document.activeElement as HTMLElement | null;
    
    function onKey(e: KeyboardEvent) { 
      if (e.key === 'Escape') onClose(); 
    }
    
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    
    // Auto-play video when modal opens
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked by browser, that's okay
      });
    }
    
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      triggerRef.current?.focus?.();
      
      // Pause video when modal closes
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, [onClose, open]);

  if (!open) return null;

  function closeModal() {
    onClose();
  }

  return createPortal(
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal video-modal" 
        ref={modalRef} 
        tabIndex={-1} 
        onClick={e => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="video-modal-title"
      >
        <header className="modal-head">
          <div>
            <h2 id="video-modal-title">{title}</h2>
          </div>
          <button className="icon-btn" onClick={closeModal} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div className="modal-body video-modal-body">
          <video 
            ref={videoRef}
            controls 
            src={videoSrc}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>,
    document.body,
  );
}
