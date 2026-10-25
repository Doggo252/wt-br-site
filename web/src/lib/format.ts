/** "1 change", "3 changes". Pass the plural when it isn't word + "s". */
export function plural(n: number, word: string, many = `${word}s`): string {
  return `${n.toLocaleString("en")} ${n === 1 ? word : many}`;
}

/** Vehicle name without the game's private glyphs, for places the WTSymbols font can't reach (feeds, titles). */
export function plainName(name: string): string {
  return name.replace(/[␕-␠⋠▀-◥☢]/g, "").trim();
}
