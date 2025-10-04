import { useCallback, useEffect, useRef } from 'react';

interface UseFocusTrapProps {
  isActive: boolean;
  onOutsideClick: VoidFunction;
}

/**
 * Traps focus within a given element.
 */
export const useFocusTrap = <T extends HTMLElement>({
  isActive,
  onOutsideClick,
}: UseFocusTrapProps) => {
  const ref = useRef<T>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (isActive && ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    },
    [ref, onOutsideClick, isActive],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isActive && event.key === 'Escape') {
        onOutsideClick();
      }
    },
    [onOutsideClick, isActive],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleClickOutside, handleKeyDown]);

  return ref;
};
