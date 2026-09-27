# Social & Chat Architecture

## Overview
VANVAS Solo connects travellers exploring the same sanctuaries through private direct messaging and spontaneous micro-expedition Circles.

---

## 1. Data Models

### A. Solo Direct Messages (`solo_direct_messages`)
- `id` (UUID / Integer Primary Key)
- `sender_id` (User ID / Profile ID)
- `recipient_id` (User ID / Profile ID)
- `content` (Message string)
- `is_read` (Boolean)
- `created_at` (Timestamp)

### B. Travel Circles (`travel_circles`) & Circle Messages (`circle_messages`)
- Circles represent spontaneous meetups (e.g. "Sunrise Hike to Jogini", "Old Manali Cafe Crawl").
- Circle group chat persists all participant messages and system events (join/leave).

---

## 2. Safety & Moderation Controls

- **Block & Report:** Travellers can block disruptive users immediately. Blocked users are restricted from sending messages or viewing presence.
- **Location Privacy:** Exact GPS coordinates are never stored or shared with other travellers. Only destination/approximate zone is shown (e.g., "Exploring Old Manali").
- **Public Gathering Guidelines:** Safety reminders prompt users to meet in public cafes, verify IDs, and avoid sharing sensitive financial data.
