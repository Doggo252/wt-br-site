import type { Metadata } from "next";
import { GuideIndex } from "@/components/pages/GuideIndex";

export const metadata: Metadata = {
  title: "Guide: how War Thunder works",
  description: "Game modes, matchmaking, armour, crews, the economy and more, explained in plain English.",
};

export default function Page() {
  return <GuideIndex />;
}
