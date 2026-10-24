import { BranchIndexPage, branchMetadata } from "@/components/pages/TreePages";

export const metadata = branchMetadata("air");

export default function Page() {
  return <BranchIndexPage branch="air" />;
}
