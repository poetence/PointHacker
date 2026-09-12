// Curated display-order for program pickers — most broadly useful/well-known
// programs first, rather than alphabetical. Purely a UI concern (not stored
// in the DB); anything not listed here sorts after, alphabetically.
const PROGRAM_PRIORITY_ORDER = [
  "Chase Ultimate Rewards",
  "American Express Membership Rewards",
  "Capital One Miles",
  "Citi ThankYou Points",
  "Bilt Rewards",
  "Delta SkyMiles",
  "United MileagePlus",
  "American AAdvantage",
  "Southwest Rapid Rewards",
  "Marriott Bonvoy",
  "Hilton Honors",
  "World of Hyatt",
  "IHG One Rewards",
  "British Airways Avios",
  "Air Canada Aeroplan",
  "Air France-KLM Flying Blue",
  "Virgin Atlantic Flying Club",
  "ANA Mileage Club",
  "Emirates Skywards",
  "Avianca LifeMiles",
  "JetBlue TrueBlue",
  "Choice Privileges",
  "Discover Cashback Bonus",
];

const priorityIndexByName = new Map(
  PROGRAM_PRIORITY_ORDER.map((name, index) => [name, index])
);

export function sortProgramsByPriority<T extends { name: string }>(programs: T[]): T[] {
  return [...programs].sort((a, b) => {
    const aIndex = priorityIndexByName.get(a.name) ?? PROGRAM_PRIORITY_ORDER.length;
    const bIndex = priorityIndexByName.get(b.name) ?? PROGRAM_PRIORITY_ORDER.length;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });
}
