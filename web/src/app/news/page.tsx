import type { Metadata } from "next";
import { NewsPage } from "@/components/pages/NewsPage";

export const metadata: Metadata = {
  title: "News and devblogs",
  description: "The latest War Thunder news and devblogs, with links to every vehicle they mention.",
};

export default function Page() {
  return <NewsPage />;
}
