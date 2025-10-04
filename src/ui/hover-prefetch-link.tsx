'use client';

import Link from 'next/link';

import { type ComponentProps, type FC, useState } from 'react';

export const HoverPrefetchLink: FC<ComponentProps<typeof Link>> = ({
  href,
  children,
  ...props
}) => {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}>
      {children}
    </Link>
  );
};
