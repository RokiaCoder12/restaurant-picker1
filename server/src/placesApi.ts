import type { CombinedPreferences } from "./roomManager.js";

const PLACES_NEW_URL = "https://places.googleapis.com/v1/places:searchText";

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
  score: number;
}

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export async function fetchRestaurants(prefs: CombinedPreferences): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const allResults: Restaurant[] = [];

  // Run one search per user's exact cuisine + area combo
  for (const q of prefs.queries) {
    const cuisineLabel = q.cuisine || "restaurant";
    const query = `${cuisineLabel} restaurant in ${q.area}`;

    const body = {
      textQuery: query,
      includedType: "restaurant",
      maxResultCount: 10,
    };

    const res = await fetch(PLACES_NEW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[places] HTTP ${res.status}: ${errText}`);
      throw new Error(`Places API HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { places?: NewPlaceResult[] };
    console.error(`[places] got ${data.places?.length ?? 0} results for "${query}"`);

    for (const place of data.places ?? []) {
      if (allResults.find((r) => r.placeId === place.id)) continue;

      const photoName = place.photos?.[0]?.name ?? null;
      const photoUrl = photoName
        ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}`
        : null;

      const priceLevelNum = place.priceLevel ? (PRICE_MAP[place.priceLevel] ?? null) : null;

      allResults.push({
        placeId: place.id,
        name: place.displayName?.text ?? "Unknown",
        address: place.formattedAddress ?? "",
        rating: place.rating ?? 0,
        userRatingsTotal: place.userRatingCount ?? 0,
        priceLevel: priceLevelNum,
        types: place.types ?? [],
        photoUrl,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
        score: computeScore(place, q.priceRange),
      });
    }
  }

  return allResults.sort((a, b) => b.score - a.score).slice(0, 5);
}

function computeScore(place: NewPlaceResult, targetPrice: number): number {
  const ratingScore = (place.rating ?? 0) * 20;
  const popularityScore = Math.min(Math.log10((place.userRatingCount ?? 1) + 1) * 15, 30);
  const numericPrice = place.priceLevel ? (PRICE_MAP[place.priceLevel] ?? targetPrice) : targetPrice;
  const priceDiff = Math.abs(numericPrice - targetPrice);
  const priceScore = Math.max(0, 20 - priceDiff * 7);
  return ratingScore + popularityScore + priceScore;
}

interface NewPlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  photos?: { name: string }[];
}
