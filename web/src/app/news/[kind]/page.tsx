import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsPage } from "@/components/pages/NewsPage";
import { NEWS_KINDS } from "@/lib/news";

export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS_KINDS.map((k) => ({ kind: k.path }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  const k = NEWS_KINDS.find((x) => x.path === kind);
  return { title: k ? `${k.label}: War Thunder news` : "News" };
}

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const k = NEWS_KINDS.find((x) => x.path === kind);
  if (!k) notFound();
  return <NewsPage kind={k} />;
}
