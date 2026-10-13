import Hero from "@/components/hero/Hero";
import Manifesto from "@/components/Manifesto";
import Collection from "@/components/collection/Collection";
import Lookbook from "@/components/Lookbook";
import SignatureCoat from "@/components/SignatureCoat";

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifesto />
      <Collection />
      <Lookbook />
      <SignatureCoat />
    </main>
  );
}
