import { ClerkProvider as Clerk } from "@clerk/nextjs";

interface ClerkProviderProps {
  children: React.ReactNode;
}
function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <Clerk
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
    >
      {children}
    </Clerk>
  );
}

export default ClerkProvider;
