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

// A suggestion whose whole name appears in the title as words ("Integrated Circuit" in
// "Integrated Circuit test"); the longest wins. Null when no suggestion is that certain.
export const findConfidentSuggestion = (title, suggestions = []) => {
  const text = ` ${normalize(title)} `;
  return suggestions
    .filter((suggestion) => {
      const name = normalize(suggestion?.title);
      return name.length >= 2 && text.includes(` ${name} `);
    })
    .sort((a, b) => normalize(b.title).length - normalize(a.title).length)[0] || null;
};

// The main keyword (named after the Item Sub Category / Item Category) of a keyword list.
export const findMainKeyword = (keywords = []) =>
  keywords.find((keyword) => Number(keyword?.is_main) === 1) || null;
