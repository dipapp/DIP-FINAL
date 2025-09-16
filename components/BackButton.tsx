'use client';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function BackButton({ className = '', children }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to dashboard if no history
      router.push('/dashboard');
    }
  };

  return (
    <button 
      onClick={handleBack}
      className={`btn btn-secondary btn-sm flex items-center space-x-2 ${className}`}
    >
      <span>←</span>
      <span>{children || 'Back'}</span>
    </button>
  );
}





