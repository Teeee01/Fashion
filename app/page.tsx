import Hero from "@/components/hero/Hero";
import Manifesto from "@/components/Manifesto";
import Collection from "@/components/collection/Collection";
import Lookbook from "@/components/Lookbook";

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifesto />
      <Collection />
      <Lookbook />
    </main>
  );
}
