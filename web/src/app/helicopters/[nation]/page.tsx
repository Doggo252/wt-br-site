import type { Metadata } from "next";
import { NationTreePage, nationMetadata, nationParams } from "@/components/pages/TreePages";

export const dynamicParams = false;

export function generateStaticParams() {
  return nationParams("heli");
}

type Params = { params: Promise<{ nation: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return nationMetadata("heli", (await params).nation);
}

export default async function Page({ params }: Params) {
  return <NationTreePage branch="heli" nation={(await params).nation} />;
}
