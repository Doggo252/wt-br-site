export type Branch = "ground" | "air" | "heli";

export const BRANCHES: Branch[] = ["ground", "air", "heli"];

export const BRANCH_NAME: Record<Branch, string> = {
  ground: "Ground forces",
  air: "Aviation",
  heli: "Helicopters",
};

export const BRANCH_SHORT: Record<Branch, string> = {
  ground: "Ground",
  air: "Air",
  heli: "Helicopters",
};

/** URL segment for each branch's tech trees. */
export const BRANCH_PATH: Record<Branch, string> = {
  ground: "ground",
  air: "air",
  heli: "helicopters",
};

export function treeHref(branch: string, nation: string): string {
  return `/${BRANCH_PATH[branch as Branch] ?? branch}/${nation}/`;
}

export function branchHref(branch: string): string {
  return `/${BRANCH_PATH[branch as Branch] ?? branch}/`;
}
