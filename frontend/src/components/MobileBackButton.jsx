import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * MobileBackButton — shown ONLY on mobile (≤768px).
 * Renders a pill-shaped back button using navigate(-1).
 * Use at the very top of any inner page's return JSX.
 */
const MobileBackButton = ({ label = 'Back' }) => {
  const navigate = useNavigate();

  return (
    <button
      className="mobile-back-btn"
      onClick={() => navigate(-1)}
      aria-label="Go back"
    >
      <ArrowLeft size={18} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
};

export default MobileBackButton;
