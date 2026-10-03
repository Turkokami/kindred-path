import { categoryById } from "@/lib/providers";

import { guard } from "@/lib/guard";

export const runtime = "nodejs";

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  phone?: string;
  website?: string;
  mapsUrl?: string;
};

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
};

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
].join(",");

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  const blocked = await guard(req, "places");
  if (blocked) return blocked;

  const url = new URL(req.url);
  const category = categoryById(url.searchParams.get("category") ?? "");
  const location = (url.searchParams.get("location") ?? "").replace(/[^\p{L}\p{N} ,.'#-]/gu, "").trim().slice(0, 80);

  if (!category) return json({ error: "Unknown category" }, 400);
  if (location.length < 2) return json({ error: "Enter a city and state, or a ZIP code" }, 400);

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return json({ error: "not_configured" }, 503);

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify({ textQuery: `${category.query} near ${location}`, pageSize: 10, regionCode: "US" }),
    });
    if (!res.ok) {
      console.error("places error", res.status, (await res.text()).slice(0, 300));
      return json({ error: "search_failed" }, 502);
    }
    const data = (await res.json()) as { places?: GooglePlace[] };
    const results: PlaceResult[] = (data.places ?? [])
      .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
      .map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "Unnamed",
        address: p.formattedAddress ?? "",
        rating: p.rating,
        ratingCount: p.userRatingCount,
        phone: p.nationalPhoneNumber,
        website: p.websiteUri,
        mapsUrl: p.googleMapsUri,
      }));
    return json({ results });
  } catch (err) {
    console.error("places error", err);
    return json({ error: "search_failed" }, 502);
  }
}
