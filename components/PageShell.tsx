import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: 80,
          background: "#04060f",
          color: "#f0f4ff",
          fontFamily: "'DM Sans', sans-serif",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
