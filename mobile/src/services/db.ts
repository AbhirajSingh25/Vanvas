import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { Destination, TripSummary, Trip, Expense } from "@vanvas/shared";

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

    CREATE TABLE IF NOT EXISTS expenses_cache (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_mutation_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Additive migration: ensure user_id column exists on legacy databases
  try {
    const expenseColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(expenses_cache)`);
    if (!expenseColumns.some((col) => col.name === "user_id")) {
      await db.execAsync(`ALTER TABLE expenses_cache ADD COLUMN user_id TEXT;`);
    }
  } catch (err) {
    console.warn("[offlineDb] Schema migration warning on expenses_cache:", err);
  }

  try {
    const queueColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(offline_mutation_queue)`);
    if (!queueColumns.some((col) => col.name === "user_id")) {
      await db.execAsync(`ALTER TABLE offline_mutation_queue ADD COLUMN user_id TEXT;`);
    }
  } catch (err) {
    console.warn("[offlineDb] Schema migration warning on offline_mutation_queue:", err);
  }
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
      if (userId) {
        memoryKv.delete(`user_trips_${userId}`);
      }
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

  // --- Permanent Account Erasure: Purge all private user records on account deletion ---
  async purgeUserAccountData(userId?: string): Promise<void> {
    const db = await getDb();
    if (!db) {
      if (userId) {
        memoryKv.delete(`user_trips_${userId}`);
        for (const key of Array.from(memoryKv.keys())) {
          if (key.startsWith(`trip_detail_${userId}_`) || key.startsWith(`expenses_${userId}_`)) {
            memoryKv.delete(key);
          }
        }
        const raw = memoryKv.get("offline_mutation_queue");
        if (raw) {
          try {
            const list = JSON.parse(raw);
            memoryKv.set(
              "offline_mutation_queue",
              JSON.stringify(list.filter((m: any) => m.user_id !== userId))
            );
          } catch {
            memoryKv.delete("offline_mutation_queue");
          }
        }
      } else {
        const dests = memoryKv.get("destinations");
        const details = Array.from(memoryKv.entries()).filter(([k]) => k.startsWith("dest_detail_"));
        memoryKv.clear();
        if (dests) memoryKv.set("destinations", dests);
        for (const [k, v] of details) memoryKv.set(k, v);
      }
      return;
    }

    await db.withTransactionAsync(async () => {
      if (userId) {
        await db.runAsync(`DELETE FROM user_trips_cache WHERE user_id = ?`, userId);
        await db.runAsync(`DELETE FROM trip_details_cache WHERE user_id = ?`, userId);
        await db.runAsync(`DELETE FROM expenses_cache WHERE user_id = ?`, userId);
        await db.runAsync(`DELETE FROM offline_mutation_queue WHERE user_id = ?`, userId);
      } else {
        await db.runAsync(`DELETE FROM user_trips_cache WHERE user_id IS NULL`);
        await db.runAsync(`DELETE FROM trip_details_cache WHERE user_id IS NULL`);
        await db.runAsync(`DELETE FROM expenses_cache WHERE user_id IS NULL`);
        await db.runAsync(`DELETE FROM offline_mutation_queue WHERE user_id IS NULL`);
      }
    });

    if (userId) {
      memoryKv.delete(`user_trips_${userId}`);
      for (const key of Array.from(memoryKv.keys())) {
        if (key.startsWith(`trip_detail_${userId}_`) || key.startsWith(`expenses_${userId}_`)) {
          memoryKv.delete(key);
        }
      }
      const raw = memoryKv.get("offline_mutation_queue");
      if (raw) {
        try {
          const list = JSON.parse(raw);
          memoryKv.set(
            "offline_mutation_queue",
            JSON.stringify(list.filter((m: any) => m.user_id !== userId))
          );
        } catch {
          memoryKv.delete("offline_mutation_queue");
        }
      }
    }
  },

  // --- Offline Expenses & Travel Ledger ---
  async cacheTripExpenses(tripId: string, expenses: Expense[], userId?: string): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      const key = userId ? `expenses_${userId}_${tripId}` : `expenses_${tripId}`;
      memoryKv.set(key, JSON.stringify(expenses));
      return;
    }
    await db.withTransactionAsync(async () => {
      // Clear previously synced expenses for this trip and this user to avoid duplicates
      if (userId) {
        await db.runAsync(
          `DELETE FROM expenses_cache WHERE trip_id = ? AND sync_status = 'synced' AND (user_id = ? OR user_id IS NULL)`,
          tripId,
          userId
        );
      } else {
        await db.runAsync(`DELETE FROM expenses_cache WHERE trip_id = ? AND sync_status = 'synced'`, tripId);
      }
      for (const exp of expenses) {
        await db.runAsync(
          `INSERT OR REPLACE INTO expenses_cache (id, trip_id, user_id, title, amount, category, date, notes, sync_status, data_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          exp.id,
          tripId,
          userId || null,
          exp.title,
          exp.amount,
          exp.category,
          exp.date,
          exp.notes || null,
          JSON.stringify(exp),
          now
        );
      }
    });
  },

  async getCachedTripExpenses(tripId: string, userId?: string): Promise<Expense[]> {
    const db = await getDb();
    if (!db) {
      const key = userId ? `expenses_${userId}_${tripId}` : `expenses_${tripId}`;
      const raw = memoryKv.get(key) || (!userId ? null : memoryKv.get(`expenses_${tripId}`));
      return raw ? JSON.parse(raw) : [];
    }
    let query = `SELECT data_json FROM expenses_cache WHERE trip_id = ?`;
    const params: any[] = [tripId];
    if (userId) {
      query += ` AND (user_id = ? OR user_id IS NULL)`;
      params.push(userId);
    }
    query += ` ORDER BY date DESC, updated_at DESC`;
    const rows = await db.getAllAsync<{ data_json: string }>(query, ...params);
    return rows.map((r) => JSON.parse(r.data_json));
  },

  async saveOfflineExpense(tripId: string, expense: Expense, isPendingSync = false, userId?: string): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      const key = userId ? `expenses_${userId}_${tripId}` : `expenses_${tripId}`;
      const raw = memoryKv.get(key);
      const existing: Expense[] = raw ? JSON.parse(raw) : [];
      memoryKv.set(key, JSON.stringify([expense, ...existing.filter((e) => e.id !== expense.id)]));
      return;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO expenses_cache (id, trip_id, user_id, title, amount, category, date, notes, sync_status, data_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      expense.id,
      tripId,
      userId || null,
      expense.title,
      expense.amount,
      expense.category,
      expense.date,
      expense.notes || null,
      isPendingSync ? "pending" : "synced",
      JSON.stringify(expense),
      now
    );
  },

  async deleteOfflineExpense(tripId: string, expenseId: string, userId?: string): Promise<void> {
    const db = await getDb();
    if (!db) {
      const key = userId ? `expenses_${userId}_${tripId}` : `expenses_${tripId}`;
      const raw = memoryKv.get(key);
      if (raw) {
        const existing: Expense[] = JSON.parse(raw);
        memoryKv.set(key, JSON.stringify(existing.filter((e) => e.id !== expenseId)));
      }
      return;
    }
    if (userId) {
      await db.runAsync(`DELETE FROM expenses_cache WHERE id = ? AND (user_id = ? OR user_id IS NULL)`, expenseId, userId);
    } else {
      await db.runAsync(`DELETE FROM expenses_cache WHERE id = ?`, expenseId);
    }
  },

  // --- Offline Mutation Queue ---
  async queueOfflineMutation(actionType: string, payload: any, userId?: string): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      const list = raw ? JSON.parse(raw) : [];
      const nextId = list.length > 0 ? Math.max(...list.map((m: any) => m.id)) + 1 : 1;
      list.push({
        id: nextId,
        user_id: userId || null,
        action_type: actionType,
        payload_json: JSON.stringify(payload),
        created_at: now,
      });
      memoryKv.set("offline_mutation_queue", JSON.stringify(list));
      return;
    }
    await db.runAsync(
      `INSERT INTO offline_mutation_queue (user_id, action_type, payload_json, created_at) VALUES (?, ?, ?, ?)`,
      userId || null,
      actionType,
      JSON.stringify(payload),
      now
    );
  },

  async getPendingMutations(userId?: string): Promise<Array<{ id: number; user_id?: string | null; action_type: string; payload_json: string; created_at: number }>> {
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      const list: Array<{ id: number; user_id?: string | null; action_type: string; payload_json: string; created_at: number }> = raw ? JSON.parse(raw) : [];
      if (userId) {
        return list.filter((m) => m.user_id === userId);
      }
      return list;
    }
    if (userId) {
      return db.getAllAsync<{ id: number; user_id?: string | null; action_type: string; payload_json: string; created_at: number }>(
        `SELECT * FROM offline_mutation_queue WHERE user_id = ? ORDER BY created_at ASC`,
        userId
      );
    }
    return db.getAllAsync<{ id: number; user_id?: string | null; action_type: string; payload_json: string; created_at: number }>(
      `SELECT * FROM offline_mutation_queue ORDER BY created_at ASC`
    );
  },

  async removeMutation(id: number): Promise<void> {
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      if (raw) {
        const list = JSON.parse(raw);
        memoryKv.set("offline_mutation_queue", JSON.stringify(list.filter((m: any) => m.id !== id)));
      }
      return;
    }
    await db.runAsync(`DELETE FROM offline_mutation_queue WHERE id = ?`, id);
  },
};
