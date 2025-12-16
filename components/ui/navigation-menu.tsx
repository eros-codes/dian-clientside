import * as React from 'react';
import { cn } from '@/lib/utils';

// Minimal, stable navigation menu wrappers.
// Header only uses NavigationMenu, NavigationMenuList and NavigationMenuItem.

const NavigationMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <nav ref={ref as any} className={cn('relative z-10 flex items-center justify-center', className)} {...props}>
      {children}
    </nav>
  )
);
NavigationMenu.displayName = 'NavigationMenu';

const NavigationMenuList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref as any} className={cn('flex list-none items-center justify-center space-x-2', className)} {...props}>
      {children}
    </div>
  )
);
NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className="inline-block">{children}</div>;
};

// Export minimal placeholders for other components to avoid breaking imports.
const NavigationMenuContent: React.FC<any> = ({ children, className }) => (
  <div className={cn(className)}>{children}</div>
);
const NavigationMenuTrigger: React.FC<any> = ({ children, className }) => (
  <button className={cn('inline-flex items-center', className)}>{children}</button>
);
const NavigationMenuLink: React.FC<any> = ({ children, className, ...props }) => (
  <a className={cn(className)} {...props}>
    {children}
  </a>
);
const NavigationMenuIndicator: React.FC<any> = () => null;
const NavigationMenuViewport: React.FC<any> = () => null;

const navigationMenuTriggerStyle = 'inline-flex h-10 items-center rounded-md px-4 py-2 text-sm';

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
