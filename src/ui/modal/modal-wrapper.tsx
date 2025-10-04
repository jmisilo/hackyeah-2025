import { type FC, type PropsWithChildren } from 'react';

import { motion } from 'framer-motion';

import { useFocusTrap } from '@/utilities/use-focus-trap';

import { useModal } from './modal-context';

export const ModalWrapper: FC<PropsWithChildren> = ({ children }) => {
  const { closeModal } = useModal();

  const ref = useFocusTrap<HTMLDivElement>({
    isActive: true,
    onOutsideClick: closeModal,
  });

  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-1002 flex flex-col justify-center items-center p-10">
      <motion.div
        className="bg-black/60 absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{
          opacity: 0,
          scale: 0.2,
          y: '50%',
          transformOrigin: 'bottom center',
          transition: { type: 'spring', duration: 0.8 },
        }}
        transition={{
          type: 'spring',
          bounce: 0.25,
          duration: 0.5,
        }}
        className="z-10 bg-white max-w-lg sm:max-w-xl w-full max-h-full h-min rounded-2xl border border-black/5 overflow-y-auto"
        ref={ref}>
        <div className="bg-neutral-50/50 p-6 flex flex-col gap-y-3 size-full">{children}</div>
      </motion.div>
    </div>
  );
};
