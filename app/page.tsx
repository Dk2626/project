import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeatureStrip } from "@/components/FeatureStrip";
import { UpcomingWebinars } from "@/components/UpcomingWebinars";
import { LatestJobs } from "@/components/LatestJobs";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeatureStrip />
        <UpcomingWebinars />
        <LatestJobs />
      </main>
      <Footer />
    </>
  );
}
