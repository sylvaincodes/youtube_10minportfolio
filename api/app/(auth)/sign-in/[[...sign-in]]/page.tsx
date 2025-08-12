import React from "react";
import { SignIn } from "@clerk/nextjs";
// Nextjs ISR caching strategy
export const revalidate = false;

export default function page() {
  return <SignIn afterSignInUrl="/" />;
}

// Nextjs dynamic metadata
export function generateMetadata() {
  return {
    title: `Page - Title here`,
    description: `Page - Description here`,
    icons: {
      icon: `path to asset file`,
    },
  };
}
