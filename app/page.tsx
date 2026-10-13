import Hero from "@/components/hero/Hero";
import Manifesto from "@/components/Manifesto";
import Collection from "@/components/collection/Collection";
import Lookbook from "@/components/Lookbook";
import SignatureFeature from "@/components/SignatureFeature";
import Atelier from "@/components/Atelier";
import CampaignFilm from "@/components/CampaignFilm";
import Journal from "@/components/Journal";
import Hairline from "@/components/Hairline";
import { SIGNATURES } from "@/lib/signatures";
import { Fragment } from "react";

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
      {/* The signature series: coat, cap, pants, shoe (lib/signatures.ts) */}
      {SIGNATURES.map((sig) => (
        <Fragment key={sig.id}>
          <SignatureFeature signature={sig} />
          <Hairline />
        </Fragment>
      ))}
      <Atelier />
      <Hairline />
      <CampaignFilm />
      <Hairline />
      <Journal />
    </main>
  );
}
