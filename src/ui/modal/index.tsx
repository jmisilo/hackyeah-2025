'use client';

import { type FC, type PropsWithChildren } from 'react';
import { LuX } from 'react-icons/lu';

import { useModal } from './modal-context';

export { ModalContextProvider } from './modal-context';

type ModalHeaderProps =
  | {
      title?: string;
      showCloseButton: true;
    }
  | {
      title: string;
      showCloseButton?: false;
    };

const ModalHeader: FC<ModalHeaderProps> = ({ title, showCloseButton = false }) => {
  const { closeModal } = useModal();

  return (
    <header className="">
      <div className="flex justify-between">
        {!!title && <h2 className="font-medium text-lg sm:text-xl">{title}</h2>}

        {showCloseButton && (
          <button onClick={closeModal}>
            <LuX className="text-xl text-black/60" />
          </button>
        )}
      </div>
    </header>
  );
};
const ModalContent: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="overflow-auto w-full h-full pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/30 scrollbar-track-rounded-full">
      {children}
    </div>
  );
};

const ModalFooter: FC<PropsWithChildren> = ({ children }) => {
  return <footer className="flex gap-x-2 items-center justify-end">{children}</footer>;
};

export const Modal = {
  Header: ModalHeader,
  Content: ModalContent,
  Footer: ModalFooter,
  useModal,
};

export { useModal };
