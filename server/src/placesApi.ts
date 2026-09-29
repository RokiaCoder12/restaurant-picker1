import type { CombinedPreferences } from "./roomManager.js";

const PLACES_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export interface Restaurant {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel: number | null;
  types: string[];
  photoUrl: string | null;
  mapsUrl: string;
  score: number; // composite ranking score
}

export async function fetchRestaurants(prefs: CombinedPreferences): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const allResults: Restaurant[] = [];

  // Query once per cuisine; deduplicate by placeId
  const cuisinesToQuery = prefs.cuisines.length > 0 ? prefs.cuisines : ["restaurant"];

  for (const cuisine of cuisinesToQuery) {
    const query = `${cuisine} restaurant in ${prefs.area}`;
    const url = new URL(PLACES_URL);
    url.searchParams.set("query", query);
    url.searchParams.set("type", "restaurant");
    url.searchParams.set("key", apiKey);
    // Map our 1-4 scale to Google's minprice / maxprice (0-4)
    url.searchParams.set("minprice", String(Math.max(0, prefs.priceRange - 1)));
    url.searchParams.set("maxprice", String(prefs.priceRange));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);
    const data = (await res.json()) as { results: PlaceResult[]; status: string };
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places API error: ${data.status}`);
    }

    for (const place of data.results ?? []) {
      if (allResults.find((r) => r.placeId === place.place_id)) continue;
      const photoRef = place.photos?.[0]?.photo_reference ?? null;
      allResults.push({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating ?? 0,
        userRatingsTotal: place.user_ratings_total ?? 0,
        priceLevel: place.price_level ?? null,
        types: place.types ?? [],
        photoUrl: photoRef
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`
          : null,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        score: computeScore(place, prefs.priceRange),
      });
    }
  }

  // Sort by composite score descending, return top 5
  return allResults.sort((a, b) => b.score - a.score).slice(0, 5);
}

function computeScore(place: PlaceResult, targetPrice: number): number {
  const ratingScore = (place.rating ?? 0) * 20; // 0-100
  const popularityScore = Math.min(Math.log10((place.user_ratings_total ?? 1) + 1) * 15, 30); // 0-30
  // Price match: full points if exact, decreasing for distance
  const priceDiff = Math.abs((place.price_level ?? targetPrice) - targetPrice);
  const priceScore = Math.max(0, 20 - priceDiff * 7); // 0-20
  return ratingScore + popularityScore + priceScore;
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: { photo_reference: string }[];
}
