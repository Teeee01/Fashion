import Hero from "@/components/hero/Hero";
import Manifesto from "@/components/Manifesto";
import Collection from "@/components/collection/Collection";
import Lookbook from "@/components/Lookbook";
import SignatureCoat from "@/components/SignatureCoat";
import Atelier from "@/components/Atelier";
import Hairline from "@/components/Hairline";

export default function Home() {
  return (
    <main>
      <Hero />
      <Hairline />
      <Manifesto />
      <Hairline />
      <Collection />
      <Hairline />
      <Lookbook />
      <Hairline />
      <SignatureCoat />
      <Hairline />
      <Atelier />
    </main>
  );
}
