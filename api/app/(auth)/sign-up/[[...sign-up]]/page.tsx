import React from "react";
import { SignUp } from "@clerk/nextjs";
// Nextjs ISR caching strategy
export const revalidate = false;

export default function page() {
  return <SignUp afterSignInUrl="/" />;
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
