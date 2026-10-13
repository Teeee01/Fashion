import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPage from "@/components/EditorialPage";
import { ARTICLES, getArticle } from "@/lib/journal";

/* /journal/<slug> … one journal article. The copy lives in lib/journal.ts. */

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getArticle((await params).slug);
  return article ? { title: `${article.title} · Maison Sève`, description: article.standfirst } : { title: "MAISON SÈVE" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const i = ARTICLES.indexOf(article);
  const next = ARTICLES[(i + 1) % ARTICLES.length];

  return (
    <EditorialPage
      label={`Journal · ${article.category} · ${article.date}`}
      title={article.title}
      standfirst={article.standfirst}
      image={{ src: article.image.replace("ar=7:9", "ar=16:9"), alt: article.alt }}
      aspect="aspect-[4/5] md:aspect-[16/9]"
    >
      <article className="grid-12 mt-[12vh]">
        <div className="col-span-12 flex flex-col gap-7 md:col-span-6 md:col-start-4">
          {article.body.map((para, n) => (
            <p key={n} className={n === 0 ? "font-display text-[24px] leading-[1.3] md:text-[28px]" : "body-copy"} data-reveal="lines">
              {para}
            </p>
          ))}
        </div>
      </article>

      <div className="grid-12 mt-[14vh]">
        <div className="col-span-12 border-t border-hairline pt-6">
          <p className="ui-label text-stone" data-reveal="lines">
            Next in the journal
          </p>
          <p className="mask mt-4">
            <span className="block" data-reveal="block">
              <Link href={`/journal/${next.slug}`} className="font-display text-[32px] leading-[1.1] md:text-[48px]" data-transition-label="Journal">
                {next.title} →
              </Link>
            </span>
          </p>
        </div>
      </div>
    </EditorialPage>
  );
}
