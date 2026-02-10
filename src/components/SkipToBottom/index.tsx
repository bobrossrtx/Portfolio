import { useEffect, useState } from 'react';
import './SkipToBottom.scss';

const SkipToBottom = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const remaining = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight - window.scrollY;
      setVisible(remaining > 120);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const handleClick = () => {
    const y = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight || 0);
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      className="skip-to-bottom"
      aria-label="Skip to bottom"
      onClick={handleClick}
      type="button"
    >
      ↓
    </button>
  );
};

export default SkipToBottom;
