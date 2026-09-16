import { REGION_LABELS, type Region } from "@/lib/regions";

/**
 * Curated destinations for the goal form so "where to" is a pick, not free text.
 * The label is what gets stored as the goal's `label`; the region is what prices it.
 * Each region also gets a generic "Anywhere in …" entry for trips that aren't city-specific.
 */
export type Destination = { label: string; region: Region };

const CITIES: Record<Region, string[]> = {
  NORTH_AMERICA: ["New York", "Los Angeles", "San Francisco", "Chicago", "Miami", "Las Vegas", "Honolulu", "Vancouver", "Toronto", "Mexico City", "Cancún", "Cabo San Lucas"],
  CARIBBEAN: ["Aruba", "Bahamas", "Jamaica", "Puerto Rico", "Turks and Caicos", "St. Lucia", "Dominican Republic", "Barbados"],
  SOUTH_AMERICA: ["Buenos Aires", "Rio de Janeiro", "São Paulo", "Lima", "Bogotá", "Santiago", "Cartagena", "Quito"],
  EUROPE: ["London", "Paris", "Rome", "Barcelona", "Madrid", "Lisbon", "Amsterdam", "Berlin", "Dublin", "Athens", "Istanbul", "Reykjavík", "Copenhagen", "Vienna", "Prague"],
  MIDDLE_EAST: ["Dubai", "Abu Dhabi", "Doha", "Tel Aviv", "Amman", "Muscat"],
  AFRICA: ["Cape Town", "Johannesburg", "Nairobi", "Marrakech", "Cairo", "Zanzibar"],
  ASIA: ["Tokyo", "Kyoto", "Osaka", "Seoul", "Taipei", "Hong Kong", "Singapore", "Bangkok", "Phuket", "Bali", "Hanoi", "Ho Chi Minh City", "Kuala Lumpur", "Manila", "Delhi", "Mumbai", "Maldives"],
  OCEANIA: ["Sydney", "Melbourne", "Brisbane", "Auckland", "Queenstown", "Fiji", "Tahiti"],
};

export const DESTINATIONS: Destination[] = (Object.keys(CITIES) as Region[]).flatMap((region) => [
  { label: `Anywhere in ${REGION_LABELS[region]}`, region },
  ...CITIES[region].map((label) => ({ label, region })),
]);

/** Destinations grouped by region in catalog order, for a grouped picker. */
export const DESTINATIONS_BY_REGION: { region: Region; destinations: Destination[] }[] = (
  Object.keys(CITIES) as Region[]
).map((region) => ({ region, destinations: DESTINATIONS.filter((d) => d.region === region) }));

export function findDestination(label: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.label === label);
}
