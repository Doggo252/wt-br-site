import type { Metadata } from "next";
import { CompareTool } from "@/components/CompareTool";

export const metadata: Metadata = {
  title: "Compare BR history",
  description: "Compare the Battle Rating history of up to five War Thunder vehicles on one chart.",
};

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-4xl font-bold">Compare</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Put up to five vehicles, aircraft or helicopters on one BR chart. The link updates as you go, so you can
          share it.
        </p>
      </header>
      <CompareTool />
    </div>
  );
}
