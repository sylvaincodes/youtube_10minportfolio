import ClerkProvider from "./clerk-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClerkProvider>{children}</ClerkProvider>
    </>
  );
}
