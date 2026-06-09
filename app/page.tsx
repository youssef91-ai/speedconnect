import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SpeedTestClient } from "./SpeedTestClient";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <SpeedTestClient />
      </main>
      <Footer />
    </>
  );
}
