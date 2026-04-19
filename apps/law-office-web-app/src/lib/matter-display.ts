/** List/detail caption — editable; changing it does not update form prepopulation. */
export function caseDisplayName(
  caseData: Record<string, unknown> | undefined,
): string {
  if (!caseData) return "";
  const d = caseData.display_name;
  if (typeof d === "string" && d.trim() !== "") return d.trim();
  const legacy = caseData.estate_name;
  if (typeof legacy === "string" && legacy.trim() !== "") return legacy.trim();
  const dec = caseData.decedent_name;
  if (typeof dec === "string" && dec.trim() !== "") return dec.trim();
  return "";
}

/** Set once at intake; merged into form `estate_name` on load, then independent of display_name. */
export function formEstateNameSeed(
  caseData: Record<string, unknown> | undefined,
): string {
  if (!caseData) return "";
  const seed = caseData.form_estate_name_seed;
  if (typeof seed === "string" && seed.trim() !== "") return seed.trim();
  const legacy = caseData.estate_name;
  if (typeof legacy === "string" && legacy.trim() !== "") return legacy.trim();
  const dec = caseData.decedent_name;
  if (typeof dec === "string" && dec.trim() !== "") return dec.trim();
  return "";
}
