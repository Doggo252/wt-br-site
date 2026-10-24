import { BranchIndexPage, branchMetadata } from "@/components/pages/TreePages";

export const metadata = branchMetadata("heli");

export default function Page() {
  return <BranchIndexPage branch="heli" />;
}
