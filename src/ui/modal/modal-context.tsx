'use client';

import { usePathname } from 'next/navigation';

import {
  type FC,
  type PropsWithChildren,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AnimatePresence } from 'framer-motion';

import { ModalWrapper } from './modal-wrapper';

type ModalContextProps = {
  openModal: (content: ReactNode) => void;
  closeModal: VoidFunction;
};

const ModalContext = createContext<ModalContextProps | null>(null);

export const ModalContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const pathname = usePathname();

  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content);
  }, []);

  const closeModal = useCallback(() => {
    setModalContent(null);
  }, []);

  useEffect(() => {
    closeModal();
  }, [pathname, closeModal]);

  const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}

      <AnimatePresence initial={false}>
        {modalContent && <ModalWrapper>{modalContent}</ModalWrapper>}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalContextProvider');
  }

  return context;
};
