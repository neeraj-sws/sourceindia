// Shared by the admin and seller Add/Edit Product forms: the product title is the customer's own
// text, the keyword links the product to the catalogue.

const normalize = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Clicking a suggestion replaces the title only while the customer was still typing its start
// ("integ" -> "Integrated Circuit"); a longer own title ("Integrated Circuit test") is kept.
export const shouldKeepTypedTitle = (typedTitle, suggestionTitle) => {
  const typed = normalize(typedTitle);
  return Boolean(typed) && !normalize(suggestionTitle).startsWith(typed);
};

// Words without their plural ending, so "Services" and "Service", "Batteries" and "Battery" match.
const singularWords = (value) => normalize(value).split(" ").filter(Boolean).map((word) => {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
});

// A suggestion whose whole name appears in the title as words ("Integrated Circuit" in
// "Integrated Circuit test"; "PVD Coating Service" in "PVD Coating Services for Cutting Tools").
// The first suggestion of the list wins when it is such a match, so what is shown on top is what
// gets selected; otherwise the longest matching name. Null when none is that certain.
export const findConfidentSuggestion = (title, suggestions = []) => {
  const text = ` ${singularWords(title).join(" ")} `;
  const matches = suggestions
    .map((suggestion, index) => ({ suggestion, index, name: singularWords(suggestion?.title).join(" ") }))
    .filter(({ name }) => name.length >= 2 && text.includes(` ${name} `));
  if (matches[0]?.index === 0) return matches[0].suggestion;
  matches.sort((a, b) => b.name.length - a.name.length || a.index - b.index);
  return matches[0]?.suggestion || null;
};

// The main keyword (named after the Item Sub Category / Item Category) of a keyword list.
export const findMainKeyword = (keywords = []) =>
  keywords.find((keyword) => Number(keyword?.is_main) === 1) || null;
