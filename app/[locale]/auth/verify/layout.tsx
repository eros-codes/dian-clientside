import React from 'react';

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't constrain header/footer here; page itself renders a centered card inside AppShell.
  return <>{children}</>;
}
