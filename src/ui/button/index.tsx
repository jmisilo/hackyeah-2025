'use client';

import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type FC,
} from 'react';

import { type UrlObject } from 'url';

import { ButtonTheme } from '@/constants/theme.enum';
import { HoverPrefetchLink } from '@/ui/hover-prefetch-link';
import { cn } from '@/utilities/cn';

type AProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; as?: undefined | 'a' };
type LinkProps = ComponentProps<typeof HoverPrefetchLink> & {
  href: string | UrlObject;
  as: 'link';
};
type DefaultButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
};

type ButtonProps = { theme?: ButtonTheme; shadow?: 'none' | 'sm' | 'md' } & (
  | DefaultButtonProps
  | AProps
  | LinkProps
);

export const Button: FC<ButtonProps> = (props) => {
  const { className, href, theme = ButtonTheme.Primary } = props;

  const btnStyle = cn(
    'px-3 py-1.5 transition-all duration-200 ease-in-out text-sm font-medium disabled:cursor-not-allowed active:scale-95',
    {
      '': theme === ButtonTheme.Primary,
    },
    className,
  );

  if (href && typeof href === 'string') {
    const { as, ...rest } = props;

    if (as === 'link') {
      return <HoverPrefetchLink {...rest} data-testid="link" className={btnStyle} href={href} />;
    }

    return <a {...rest} data-testid="a" className={btnStyle} href={href} />;
  }

  if (href === undefined) {
    const { type = 'button' } = props;

    return <button type={type} {...props} data-testid="button" className={btnStyle} />;
  }

  throw new Error('Invalid href attribute. It should be a string or undefined.');
};
