import type { Metadata } from "next";
import { NationTreePage, nationMetadata, nationParams } from "@/components/pages/TreePages";

export const dynamicParams = false;

export function generateStaticParams() {
  return nationParams("ground");
}

type Params = { params: Promise<{ nation: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return nationMetadata("ground", (await params).nation);
}

export default async function Page({ params }: Params) {
  return <NationTreePage branch="ground" nation={(await params).nation} />;
}
