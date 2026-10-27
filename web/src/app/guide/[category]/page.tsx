import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideIndex } from "@/components/pages/GuideIndex";
import { GUIDE_CATEGORIES, getGuide } from "@/lib/guide";

export const dynamicParams = false;

export function generateStaticParams() {
  const pages = getGuide();
  return GUIDE_CATEGORIES.filter((c) => pages.some((p) => p.category === c.id)).map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = GUIDE_CATEGORIES.find((x) => x.id === category);
  return c ? { title: `${c.label}: War Thunder guide`, description: c.blurb } : { title: "Guide" };
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = GUIDE_CATEGORIES.find((x) => x.id === category);
  if (!c) notFound();
  return <GuideIndex only={c.id} />;
}
