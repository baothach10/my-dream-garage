import { gsap } from 'gsap';
import { useEffect } from 'react';
import './MobileLinkButton.css';

export const MobileLinkButton: React.FC<{ href: string; children: React.ReactNode; name: string }> = ({ href, children, name }) => {
    useEffect(() => {
        const btn = document.querySelector<HTMLDivElement>(`.${name}`);
        if (btn) {
            const handleTouchStart = () => onTouchStart(btn);
            const handleTouchEnd = () => onTouchEnd(btn);
            btn.addEventListener("touchstart", handleTouchStart);
            btn.addEventListener("touchend", handleTouchEnd);
            btn.addEventListener("touchcancel", handleTouchEnd);
            // Cleanup function
            return () => {
                btn.removeEventListener("touchstart", handleTouchStart);
                btn.removeEventListener("touchend", handleTouchEnd);
                btn.removeEventListener("touchcancel", handleTouchEnd);
            };
        }
        // Return a no-op cleanup function if btn is null
        return () => {};
    }, []);
    const onTouchStart = (btn: HTMLDivElement) => {
        gsap.to(btn, { scale: 0.8, duration: 0.1, ease: "power2.out" });
    };

    const onTouchEnd = (btn: HTMLDivElement) => {
        gsap.to(btn, { scale: 1, duration: 0.1, ease: "power2.out", onComplete: () => handleClick() });

    };

    const handleClick = () => {
        window.open(href, '_blank', 'noopener,noreferrer');
    }
    return (
        <div className='mobile-button'>
            {children}
        </div>
    )
}