"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({
  children,
  clientId,
}: {
  children: React.ReactNode;
  clientId: string;
}) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
