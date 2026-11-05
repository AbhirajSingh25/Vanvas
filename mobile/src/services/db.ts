import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { Destination, TripSummary, Trip } from "@vanvas/shared";

const DB_NAME = "vanvas_offline.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
const memoryKv = new Map<string, string>();

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") return null;
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initSchema(dbInstance);
  }
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS destinations_cache (
      id TEXT PRIMARY KEY,
      slug TEXT,
      name TEXT,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS destination_details_cache (
      slug_or_id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_trips_cache (
      trip_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trip_details_cache (
      trip_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

export const offlineDb = {
  // --- Destinations Catalogue ---
  async cacheDestinations(destinations: Destination[]): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set("destinations", JSON.stringify(destinations));
      return;
    }
    await db.withTransactionAsync(async () => {
      for (const d of destinations) {
        await db.runAsync(
          `INSERT OR REPLACE INTO destinations_cache (id, slug, name, data_json, updated_at) VALUES (?, ?, ?, ?, ?)`,
          d.id,
          d.slug,
          d.name,
          JSON.stringify(d),
          now
        );
      }
    });
  },

  async getCachedDestinations(): Promise<Destination[]> {
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get("destinations");
      return raw ? JSON.parse(raw) : [];
    }
    const rows = await db.getAllAsync<{ data_json: string }>(
      `SELECT data_json FROM destinations_cache ORDER BY name ASC`
    );
    return rows.map((r) => JSON.parse(r.data_json));
  },

  // --- Destination Details ---
  async cacheDestinationDetail(slugOrId: string, detailData: any): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`dest_detail_${slugOrId.toLowerCase()}`, JSON.stringify(detailData));
      return;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO destination_details_cache (slug_or_id, data_json, updated_at) VALUES (?, ?, ?)`,
      slugOrId.toLowerCase(),
      JSON.stringify(detailData),
      now
    );
  },

  async getCachedDestinationDetail(slugOrId: string): Promise<any | null> {
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`dest_detail_${slugOrId.toLowerCase()}`);
      return raw ? JSON.parse(raw) : null;
    }
    const row = await db.getFirstAsync<{ data_json: string }>(
      `SELECT data_json FROM destination_details_cache WHERE slug_or_id = ?`,
      slugOrId.toLowerCase()
    );
    return row ? JSON.parse(row.data_json) : null;
  },

  // --- User Trips Summaries ---
  async cacheUserTrips(userId: string, trips: TripSummary[]): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`user_trips_${userId}`, JSON.stringify(trips));
      return;
    }
    await db.withTransactionAsync(async () => {
      // Clear previous trips for this user before caching fresh batch
      await db.runAsync(`DELETE FROM user_trips_cache WHERE user_id = ?`, userId);
      for (const t of trips) {
        await db.runAsync(
          `INSERT OR REPLACE INTO user_trips_cache (trip_id, user_id, data_json, updated_at) VALUES (?, ?, ?, ?)`,
          t.id,
          userId,
          JSON.stringify(t),
          now
        );
      }
    });
  },

  async getCachedUserTrips(userId: string): Promise<TripSummary[]> {
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`user_trips_${userId}`);
      return raw ? JSON.parse(raw) : [];
    }
    const rows = await db.getAllAsync<{ data_json: string }>(
      `SELECT data_json FROM user_trips_cache WHERE user_id = ? ORDER BY updated_at DESC`,
      userId
    );
    return rows.map((r) => JSON.parse(r.data_json));
  },

  // --- Trip Details Snapshot ---
  async cacheTripDetail(userId: string, trip: Trip): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`trip_detail_${trip.id}`, JSON.stringify(trip));
      return;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO trip_details_cache (trip_id, user_id, data_json, updated_at) VALUES (?, ?, ?, ?)`,
      trip.id,
      userId,
      JSON.stringify(trip),
      now
    );
  },

  async getCachedTripDetail(tripId: string): Promise<Trip | null> {
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`trip_detail_${tripId}`);
      return raw ? JSON.parse(raw) : null;
    }
    const row = await db.getFirstAsync<{ data_json: string }>(
      `SELECT data_json FROM trip_details_cache WHERE trip_id = ?`,
      tripId
    );
    return row ? JSON.parse(row.data_json) : null;
  },

  // --- Session Isolation: Clear user data on sign out ---
  async clearUserSessionCache(userId?: string): Promise<void> {
    const db = await getDb();
    if (!db) {
      memoryKv.clear();
      return;
    }
    if (userId) {
      await db.runAsync(`DELETE FROM user_trips_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM trip_details_cache WHERE user_id = ?`, userId);
    } else {
      await db.runAsync(`DELETE FROM user_trips_cache`);
      await db.runAsync(`DELETE FROM trip_details_cache`);
    }
  },
};
