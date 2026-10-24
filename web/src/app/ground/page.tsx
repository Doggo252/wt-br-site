import { BranchIndexPage, branchMetadata } from "@/components/pages/TreePages";

export const metadata = branchMetadata("ground");

export default function Page() {
  return <BranchIndexPage branch="ground" />;
}
