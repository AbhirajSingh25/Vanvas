import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { Destination, TripSummary, Trip, Expense } from "@vanvas/shared";

const DB_NAME = "vanvas_offline.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let schemaMigrationError: Error | null = null;
let forceMemoryMode = false;
const memoryKv = new Map<string, string>();

function ensureMigrationReady(): void {
  if (schemaMigrationError) {
    throw new Error(`[offlineDb] Private cache access blocked: ${schemaMigrationError.message}`);
  }
}

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (forceMemoryMode || Platform.OS === "web") return null;
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initSchema(dbInstance);
  }
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  schemaMigrationError = null;
  try {
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
        trip_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (trip_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS trip_details_cache (
        trip_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (trip_id, user_id)
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
    const expenseColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(expenses_cache)`);
    if (!expenseColumns.some((col) => col.name === "user_id")) {
      await db.execAsync(`ALTER TABLE expenses_cache ADD COLUMN user_id TEXT;`);
    }

    const queueColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(offline_mutation_queue)`);
    if (!queueColumns.some((col) => col.name === "user_id")) {
      await db.execAsync(`ALTER TABLE offline_mutation_queue ADD COLUMN user_id TEXT;`);
    }

    // Performance indexes for user-scoped lookups
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_expenses_user_trip ON expenses_cache(user_id, trip_id);
      CREATE INDEX IF NOT EXISTS idx_mutations_user_created ON offline_mutation_queue(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_trip_details_user_trip ON trip_details_cache(user_id, trip_id);
      CREATE INDEX IF NOT EXISTS idx_user_trips_user_updated ON user_trips_cache(user_id, updated_at);
    `);

    // Migration verification: fail safely if user_id column is missing
    const verifiedExpCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(expenses_cache)`);
    const verifiedQueueCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(offline_mutation_queue)`);

    if (!verifiedExpCols.some((col) => col.name === "user_id") || !verifiedQueueCols.some((col) => col.name === "user_id")) {
      throw new Error("Critical: Migration verification failed - user_id column missing");
    }
  } catch (err: any) {
    schemaMigrationError = new Error(`Database schema migration failed: ${err.message || String(err)}`);
    console.error("[offlineDb] Schema initialization failed:", schemaMigrationError);
    throw schemaMigrationError;
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
    if (!userId) {
      throw new Error("[offlineDb] cacheTripDetail requires an authenticated userId");
    }
    ensureMigrationReady();
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`trip_detail_${userId}_${trip.id}`, JSON.stringify(trip));
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

  async getCachedTripDetail(userId: string, tripId: string): Promise<Trip | null> {
    if (!userId) {
      throw new Error("[offlineDb] getCachedTripDetail requires an authenticated userId");
    }
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`trip_detail_${userId}_${tripId}`);
      return raw ? JSON.parse(raw) : null;
    }
    const row = await db.getFirstAsync<{ data_json: string }>(
      `SELECT data_json FROM trip_details_cache WHERE trip_id = ? AND user_id = ?`,
      tripId,
      userId
    );
    return row ? JSON.parse(row.data_json) : null;
  },

  // --- Session Isolation: Clear user data on sign out ---
  async clearUserSessionCache(userId: string): Promise<void> {
    if (!userId) return;
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      memoryKv.delete(`user_trips_${userId}`);
      for (const key of Array.from(memoryKv.keys())) {
        if (key.startsWith(`trip_detail_${userId}_`)) {
          memoryKv.delete(key);
        }
      }
      return;
    }
    await db.runAsync(`DELETE FROM user_trips_cache WHERE user_id = ?`, userId);
    await db.runAsync(`DELETE FROM trip_details_cache WHERE user_id = ?`, userId);
  },

  // --- Permanent Account Erasure: Purge all private user records on account deletion ---
  async purgeUserAccountData(userId: string): Promise<void> {
    if (!userId) {
      throw new Error("[offlineDb] purgeUserAccountData requires an authenticated userId");
    }
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
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
      return;
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM user_trips_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM trip_details_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM expenses_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM offline_mutation_queue WHERE user_id = ?`, userId);
    });

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
  },

  // --- Offline Expenses & Travel Ledger ---
  async cacheTripExpenses(userId: string, tripId: string, expenses: Expense[]): Promise<void> {
    if (!userId) {
      throw new Error("[offlineDb] cacheTripExpenses requires an authenticated userId");
    }
    ensureMigrationReady();
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`expenses_${userId}_${tripId}`, JSON.stringify(expenses));
      return;
    }
    await db.withTransactionAsync(async () => {
      // Clear previously synced expenses strictly for this user and trip
      await db.runAsync(
        `DELETE FROM expenses_cache WHERE trip_id = ? AND sync_status = 'synced' AND user_id = ?`,
        tripId,
        userId
      );
      for (const exp of expenses) {
        await db.runAsync(
          `INSERT OR REPLACE INTO expenses_cache (id, trip_id, user_id, title, amount, category, date, notes, sync_status, data_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          exp.id,
          tripId,
          userId,
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

  async getCachedTripExpenses(userId: string, tripId: string): Promise<Expense[]> {
    if (!userId) {
      throw new Error("[offlineDb] getCachedTripExpenses requires an authenticated userId");
    }
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`expenses_${userId}_${tripId}`);
      return raw ? JSON.parse(raw) : [];
    }
    const rows = await db.getAllAsync<{ data_json: string }>(
      `SELECT data_json FROM expenses_cache WHERE trip_id = ? AND user_id = ? ORDER BY date DESC, updated_at DESC`,
      tripId,
      userId
    );
    return rows.map((r) => JSON.parse(r.data_json));
  },

  async saveOfflineExpense(userId: string, tripId: string, expense: Expense, isPendingSync = false): Promise<void> {
    if (!userId) {
      throw new Error("[offlineDb] saveOfflineExpense requires an authenticated userId");
    }
    ensureMigrationReady();
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      const key = `expenses_${userId}_${tripId}`;
      const raw = memoryKv.get(key);
      const existing: Expense[] = raw ? JSON.parse(raw) : [];
      memoryKv.set(key, JSON.stringify([expense, ...existing.filter((e) => e.id !== expense.id)]));
      return;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO expenses_cache (id, trip_id, user_id, title, amount, category, date, notes, sync_status, data_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      expense.id,
      tripId,
      userId,
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

  async deleteOfflineExpense(userId: string, tripId: string, expenseId: string): Promise<void> {
    if (!userId) {
      throw new Error("[offlineDb] deleteOfflineExpense requires an authenticated userId");
    }
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const key = `expenses_${userId}_${tripId}`;
      const raw = memoryKv.get(key);
      if (raw) {
        const existing: Expense[] = JSON.parse(raw);
        memoryKv.set(key, JSON.stringify(existing.filter((e) => e.id !== expenseId)));
      }
      return;
    }
    await db.runAsync(
      `DELETE FROM expenses_cache WHERE id = ? AND trip_id = ? AND user_id = ?`,
      expenseId,
      tripId,
      userId
    );
  },

  // --- Offline Mutation Queue ---
  async queueOfflineMutation(userId: string, actionType: string, payload: any): Promise<void> {
    if (!userId) {
      throw new Error("[offlineDb] queueOfflineMutation requires an authenticated userId");
    }
    ensureMigrationReady();
    const db = await getDb();
    const now = Date.now();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      const list = raw ? JSON.parse(raw) : [];
      const nextId = list.length > 0 ? Math.max(...list.map((m: any) => m.id)) + 1 : 1;
      list.push({
        id: nextId,
        user_id: userId,
        action_type: actionType,
        payload_json: JSON.stringify(payload),
        created_at: now,
      });
      memoryKv.set("offline_mutation_queue", JSON.stringify(list));
      return;
    }
    await db.runAsync(
      `INSERT INTO offline_mutation_queue (user_id, action_type, payload_json, created_at) VALUES (?, ?, ?, ?)`,
      userId,
      actionType,
      JSON.stringify(payload),
      now
    );
  },

  async getPendingMutations(userId: string): Promise<Array<{ id: number; user_id: string; action_type: string; payload_json: string; created_at: number }>> {
    if (!userId) {
      throw new Error("[offlineDb] getPendingMutations requires an authenticated userId");
    }
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      const list: Array<{ id: number; user_id: string; action_type: string; payload_json: string; created_at: number }> = raw ? JSON.parse(raw) : [];
      return list.filter((m) => m.user_id === userId);
    }
    return db.getAllAsync<{ id: number; user_id: string; action_type: string; payload_json: string; created_at: number }>(
      `SELECT * FROM offline_mutation_queue WHERE user_id = ? ORDER BY created_at ASC`,
      userId
    );
  },

  async removeMutation(id: number): Promise<void> {
    ensureMigrationReady();
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

  // --- Testing Hooks for Real Implementation Verification ---
  _setDatabaseForTesting(mockDb: any): void {
    if (mockDb === null) {
      forceMemoryMode = true;
      dbInstance = null;
    } else {
      forceMemoryMode = false;
      dbInstance = mockDb;
    }
    schemaMigrationError = null;
  },

  _setMigrationErrorForTesting(err: Error | null): void {
    schemaMigrationError = err;
  },

  _getMemoryKvForTesting(): Map<string, string> {
    return memoryKv;
  },

  _resetForTesting(): void {
    dbInstance = null;
    forceMemoryMode = false;
    schemaMigrationError = null;
    memoryKv.clear();
  },

  async _initSchemaForTesting(db: any): Promise<void> {
    return initSchema(db);
  },
};
