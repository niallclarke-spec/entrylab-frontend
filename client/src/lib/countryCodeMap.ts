/**
 * Map common country names to ISO 3166-1 alpha-2 country codes for Schema.org compliance
 */
export const countryNameToCode: Record<string, string> = {
  // Common forex broker/prop firm locations
  "Australia": "AU",
  "Saint Lucia": "LC",
  "United Kingdom": "GB",
  "United States": "US",
  "Cyprus": "CY",
  "Seychelles": "SC",
  "Belize": "BZ",
  "Vanuatu": "VU",
  "Malta": "MT",
  "Gibraltar": "GI",
  "British Virgin Islands": "VG",
  "Cayman Islands": "KY",
  "Mauritius": "MU",
  "Canada": "CA",
  "Switzerland": "CH",
  "UAE": "AE",
  "United Arab Emirates": "AE",
  "Singapore": "SG",
  "Hong Kong": "HK",
  "Japan": "JP",
  "Germany": "DE",
  "France": "FR",
  "Netherlands": "NL",
  "Poland": "PL",
  "Spain": "ES",
  "Italy": "IT",
  "South Africa": "ZA",
  "New Zealand": "NZ",
  "China": "CN",
  "India": "IN",
  "Brazil": "BR",
  "Mexico": "MX",
  "Argentina": "AR",
  "Chile": "CL",
  "Russia": "RU",
  "Turkey": "TR",
  "Israel": "IL",
  "Ireland": "IE",
  "Estonia": "EE",
  "Latvia": "LV",
  "Lithuania": "LT",
  "Czech Republic": "CZ",
  "Slovakia": "SK",
  "Hungary": "HU",
  "Romania": "RO",
  "Bulgaria": "BG",
  "Greece": "GR",
  "Portugal": "PT",
  "Austria": "AT",
  "Belgium": "BE",
  "Luxembourg": "LU",
  "Denmark": "DK",
  "Sweden": "SE",
  "Norway": "NO",
  "Finland": "FI",
  "Iceland": "IS"
};

/**
 * Convert country name to ISO code for Schema.org addressCountry
 */
export function getCountryCode(countryName: string | undefined): string | undefined {
  if (!countryName) return undefined;
  
  const trimmed = countryName.trim();
  
  // If it's already a 2-letter code, return as-is
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Look up the country name (case-insensitive)
  const code = countryNameToCode[trimmed] || 
               Object.entries(countryNameToCode).find(
                 ([name]) => name.toLowerCase() === trimmed.toLowerCase()
               )?.[1];
  
  // If not found, return the original (Google may still accept it)
  return code || trimmed;
}
