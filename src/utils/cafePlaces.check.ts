/**
 * Self-check for the pure helpers in cafePlaces. No test framework needed:
 *   node src/utils/cafePlaces.check.ts
 * Node strips the TypeScript types natively.
 *
 * The network-facing exports (searchCafePlaces, fetchPlacePhoto) need a browser
 * and a live key, so they are checked in the browser walkthrough, not here.
 */
import assert from "node:assert/strict";
import { localityFromAddress, mapsUrlForPlace } from "./cafePlaces.ts";

// --- mapsUrlForPlace ---------------------------------------------------------

assert.equal(
  mapsUrlForPlace("ChIJ2fzCmcW7j4AR2JzfXBBoh6E"),
  "https://www.google.com/maps/place/?q=place_id:ChIJ2fzCmcW7j4AR2JzfXBBoh6E",
  "builds the place-ID share link"
);

assert.ok(
  !mapsUrlForPlace("a b&c=d").includes(" "),
  "escapes anything that would break the query string"
);

// --- localityFromAddress -----------------------------------------------------

assert.equal(
  localityFromAddress("12, Jalan SS2/24, SS 2, 47300 Petaling Jaya, Selangor, Malaysia"),
  "Petaling Jaya",
  "Malaysian address: town sits before the state, numeric postcode stripped"
);

assert.equal(
  localityFromAddress("10 Berwick St, Soho, London W1F 0PU, UK"),
  "Soho",
  "UK address: neighbourhood sits before the city, alphanumeric postcode stripped"
);

assert.equal(
  localityFromAddress("Lot 10, Bukit Bintang, 55100 Kuala Lumpur, Malaysia"),
  "Bukit Bintang",
  "three usable segments still resolve to the one before last"
);

assert.equal(
  localityFromAddress("Kuala Lumpur, Malaysia"),
  "Kuala Lumpur",
  "two segments: country dropped, the remainder stands alone"
);

assert.equal(
  localityFromAddress("Malaysia"),
  "Malaysia",
  "a lone segment is never dropped — better to prefill something than nothing"
);

assert.equal(localityFromAddress(null), null, "no address, no locality");
assert.equal(localityFromAddress(""), null, "empty address, no locality");
assert.equal(localityFromAddress("47300, 55100"), null, "postcodes only, nothing left to use");

console.log("cafePlaces: all checks passed");
