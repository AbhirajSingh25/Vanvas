# Accommodation Booking & Mobility Integration Architecture

## Overview
VANVAS strictly enforces verified deep links and truthful fallbacks for all accommodation and mobility providers across India.

---

## 1. Booking Link Integrity

- **Prohibition of Placeholder Domains:** Dummy domains such as `booking.vanvas.com` or localhost URLs are explicitly blocked and filtered out.
- **Provider Resolution Hierarchy:**
  1. Verified direct booking URL (e.g. Booking.com, Agoda, MakeMyTrip, Official Hotel Engine) -> Opens official portal in new secure tab.
  2. Official property website / phone number -> Renders "Contact Front Desk" (`tel:` link) or "Official Website".
  3. Physical location / coordinates -> Renders "Get Directions" via Google Maps navigation.
  4. Unlisted contact -> Truthfully displays *"Rate upon inquiry"*.

---

## 2. Mobility Provider Integrations

- **Direct Action Links:** Rental cards provide direct buttons for:
  - **Call:** `tel:+91...`
  - **WhatsApp:** `https://wa.me/...` (only if verified public WhatsApp number exists)
  - **Directions:** Direct navigation link to the local rental station / hub.
  - **Website:** Official portal link.
- **Vehicle Artwork Resolver:** Intelligently maps 2-wheelers:
  - `bicycle`, `cycle`, `pedal`, `mtb` -> High-resolution bicycle artwork.
  - `bike`, `motorbike`, `motorcycle`, `Royal Enfield`, `Himalayan`, `scooter`, `Activa` -> Motor vehicle artwork.
