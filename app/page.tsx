import Hero from "@/components/hero/Hero";
import Manifesto from "@/components/Manifesto";
import Collection from "@/components/collection/Collection";
import Lookbook from "@/components/Lookbook";
import SignatureCoat from "@/components/SignatureCoat";
import Atelier from "@/components/Atelier";
import CampaignFilm from "@/components/CampaignFilm";
import Journal from "@/components/Journal";
import Hairline from "@/components/Hairline";

export default function Home() {
  return (
    <main id="main" tabIndex={-1}>
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
      <Hairline />
      <CampaignFilm />
      <Hairline />
      <Journal />
    </main>
  );
}
