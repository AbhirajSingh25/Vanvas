import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { Destination, TripSummary, Trip, Expense, CrewCircle, Friendship } from "@vanvas/shared";

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

function validateUserId(userId: string, methodName: string): void {
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    throw new Error(`[offlineDb] ${methodName} requires an authenticated non-empty userId`);
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

/**
 * Versioned, idempotent migration for tables that need composite primary key (trip_id, user_id).
 * Preserves all valid user-owned records, isolates unowned/NULL records in quarantine tables,
 * and recreates required indexes within a safe transactional workflow.
 */
async function migrateTableToCompositePrimaryKey(
  db: SQLite.SQLiteDatabase,
  tableName: "user_trips_cache" | "trip_details_cache"
): Promise<void> {
  const cols = await db.getAllAsync<{ name: string; type: string; notnull: number; pk: number }>(
    `PRAGMA table_info(${tableName})`
  );
  if (cols.length === 0) {
    return;
  }

  const pkCols = cols.filter((c) => c.pk > 0);
  const hasTripIdPk = pkCols.some((c) => c.name === "trip_id");
  const hasUserIdPk = pkCols.some((c) => c.name === "user_id");

  // If already composite primary key (both trip_id and user_id have pk > 0), skip migration
  if (hasTripIdPk && hasUserIdPk && pkCols.length === 2) {
    return;
  }

  // Old table has single PK or missing composite PK: execute safe replacement
  const tempTable = `${tableName}_new_composite`;
  const quarantineTable = `legacy_quarantine_${tableName}`;
  const hasUserIdCol = cols.some((c) => c.name === "user_id");

  // Create quarantine table for unowned records
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${quarantineTable} (
      trip_id TEXT,
      user_id TEXT,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      quarantined_at INTEGER NOT NULL
    );

    CREATE TABLE ${tempTable} (
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (trip_id, user_id)
    );
  `);

  if (hasUserIdCol) {
    // Quarantine any records where user_id is NULL or empty
    await db.execAsync(`
      INSERT INTO ${quarantineTable} (trip_id, user_id, data_json, updated_at, quarantined_at)
      SELECT trip_id, user_id, data_json, updated_at, ${Date.now()}
      FROM ${tableName}
      WHERE user_id IS NULL OR TRIM(user_id) = '';
    `);

    // Copy valid user-owned records into the replacement table
    await db.execAsync(`
      INSERT OR REPLACE INTO ${tempTable} (trip_id, user_id, data_json, updated_at)
      SELECT trip_id, user_id, data_json, updated_at
      FROM ${tableName}
      WHERE user_id IS NOT NULL AND TRIM(user_id) != '';
    `);
  } else {
    // Ancient table without user_id column: quarantine everything
    await db.execAsync(`
      INSERT INTO ${quarantineTable} (trip_id, user_id, data_json, updated_at, quarantined_at)
      SELECT trip_id, NULL, data_json, updated_at, ${Date.now()}
      FROM ${tableName};
    `);
  }

  // Drop old table and rename replacement table
  await db.execAsync(`
    DROP TABLE ${tableName};
    ALTER TABLE ${tempTable} RENAME TO ${tableName};
  `);

  // Post-migration verification
  const newCols = await db.getAllAsync<{ name: string; pk: number }>(`PRAGMA table_info(${tableName})`);
  const newPkCols = newCols.filter((c) => c.pk > 0);
  if (!newPkCols.some((c) => c.name === "trip_id") || !newPkCols.some((c) => c.name === "user_id")) {
    throw new Error(`Migration verification failed: ${tableName} does not have composite primary key`);
  }
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  schemaMigrationError = null;
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );

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

      CREATE TABLE IF NOT EXISTS user_circles_cache (
        circle_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (circle_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS user_friends_cache (
        friend_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (friend_id, user_id)
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

    // Composite primary key migrations for existing tables with single PK
    await migrateTableToCompositePrimaryKey(db, "user_trips_cache");
    await migrateTableToCompositePrimaryKey(db, "trip_details_cache");

    // Performance indexes for user-scoped lookups
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_expenses_user_trip ON expenses_cache(user_id, trip_id);
      CREATE INDEX IF NOT EXISTS idx_mutations_user_created ON offline_mutation_queue(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_trip_details_user_trip ON trip_details_cache(user_id, trip_id);
      CREATE INDEX IF NOT EXISTS idx_user_trips_user_updated ON user_trips_cache(user_id, updated_at);
    `);

    // Record migration version 2
    await db.execAsync(`
      INSERT OR REPLACE INTO schema_migrations (version, applied_at)
      VALUES (2, ${Date.now()});
    `);

    // Final verification: fail safely if columns or composite primary keys are missing
    const verifiedExpCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(expenses_cache)`);
    const verifiedQueueCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(offline_mutation_queue)`);
    const verifiedTripCols = await db.getAllAsync<{ name: string; pk: number }>(`PRAGMA table_info(user_trips_cache)`);
    const verifiedDetailCols = await db.getAllAsync<{ name: string; pk: number }>(`PRAGMA table_info(trip_details_cache)`);

    const tripPkCols = verifiedTripCols.filter((c) => c.pk > 0);
    const detailPkCols = verifiedDetailCols.filter((c) => c.pk > 0);

    if (
      !verifiedExpCols.some((col) => col.name === "user_id") ||
      !verifiedQueueCols.some((col) => col.name === "user_id") ||
      tripPkCols.length < 2 ||
      detailPkCols.length < 2
    ) {
      throw new Error("Critical: Migration verification failed - required columns or composite PKs missing");
    }
  } catch (err: any) {
    schemaMigrationError = new Error(`Database schema migration failed: ${err.message || String(err)}`);
    console.error("[offlineDb] Schema initialization failed:", schemaMigrationError);
    throw schemaMigrationError;
  }
}

export const offlineDb = {
  // --- Destinations Catalogue (Public Global) ---
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

  // --- Destination Details (Public Global) ---
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

  // --- User Trips Summaries (Account Scoped) ---
  async cacheUserTrips(userId: string, trips: TripSummary[]): Promise<void> {
    validateUserId(userId, "cacheUserTrips");
    ensureMigrationReady();
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`user_trips_${userId}`, JSON.stringify(trips));
      return;
    }
    await db.withTransactionAsync(async () => {
      // Clear previous trips strictly for this user before caching fresh batch
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
    validateUserId(userId, "getCachedUserTrips");
    ensureMigrationReady();
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

  // --- Trip Details Snapshot (Account Scoped) ---
  async cacheTripDetail(userId: string, trip: Trip): Promise<void> {
    validateUserId(userId, "cacheTripDetail");
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
    validateUserId(userId, "getCachedTripDetail");
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

  // --- Crew Circles & Friends Snapshot (Account Scoped) ---
  async cacheCrewCircles(userId: string, circles: CrewCircle[]): Promise<void> {
    validateUserId(userId, "cacheCrewCircles");
    ensureMigrationReady();
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`user_circles_${userId}`, JSON.stringify(circles));
      return;
    }
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM user_circles_cache WHERE user_id = ?`, userId);
      for (const circle of circles) {
        await db.runAsync(
          `INSERT OR REPLACE INTO user_circles_cache (circle_id, user_id, data_json, updated_at) VALUES (?, ?, ?, ?)`,
          circle.id,
          userId,
          JSON.stringify(circle),
          now
        );
      }
    });
  },

  async getCachedCrewCircles(userId: string): Promise<CrewCircle[]> {
    validateUserId(userId, "getCachedCrewCircles");
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`user_circles_${userId}`);
      return raw ? JSON.parse(raw) : [];
    }
    const rows = await db.getAllAsync<{ data_json: string }>(
      `SELECT data_json FROM user_circles_cache WHERE user_id = ? ORDER BY updated_at DESC`,
      userId
    );
    return rows.map((r) => JSON.parse(r.data_json));
  },

  async cacheFriends(userId: string, friends: Friendship[]): Promise<void> {
    validateUserId(userId, "cacheFriends");
    ensureMigrationReady();
    const now = Date.now();
    const db = await getDb();
    if (!db) {
      memoryKv.set(`user_friends_${userId}`, JSON.stringify(friends));
      return;
    }
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM user_friends_cache WHERE user_id = ?`, userId);
      for (const friend of friends) {
        await db.runAsync(
          `INSERT OR REPLACE INTO user_friends_cache (friend_id, user_id, data_json, updated_at) VALUES (?, ?, ?, ?)`,
          friend.id,
          userId,
          JSON.stringify(friend),
          now
        );
      }
    });
  },

  async getCachedFriends(userId: string): Promise<Friendship[]> {
    validateUserId(userId, "getCachedFriends");
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get(`user_friends_${userId}`);
      return raw ? JSON.parse(raw) : [];
    }
    const rows = await db.getAllAsync<{ data_json: string }>(
      `SELECT data_json FROM user_friends_cache WHERE user_id = ? ORDER BY updated_at DESC`,
      userId
    );
    return rows.map((r) => JSON.parse(r.data_json));
  },

  // --- Session Isolation: Clear user data on sign out ---
  async clearUserSessionCache(userId: string): Promise<void> {
    validateUserId(userId, "clearUserSessionCache");
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
    await db.runAsync(`DELETE FROM user_circles_cache WHERE user_id = ?`, userId);
    await db.runAsync(`DELETE FROM user_friends_cache WHERE user_id = ?`, userId);
  },

  // --- Permanent Account Erasure: Purge all private user records on account deletion ---
  async purgeUserAccountData(userId: string): Promise<void> {
    validateUserId(userId, "purgeUserAccountData");
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      memoryKv.delete(`user_trips_${userId}`);
      memoryKv.delete(`user_circles_${userId}`);
      memoryKv.delete(`user_friends_${userId}`);
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
      await db.runAsync(`DELETE FROM user_circles_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM user_friends_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM expenses_cache WHERE user_id = ?`, userId);
      await db.runAsync(`DELETE FROM offline_mutation_queue WHERE user_id = ?`, userId);
    });

    memoryKv.delete(`user_trips_${userId}`);
    memoryKv.delete(`user_circles_${userId}`);
    memoryKv.delete(`user_friends_${userId}`);
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

  // --- Offline Expenses & Travel Ledger (Account Scoped) ---
  async cacheTripExpenses(userId: string, tripId: string, expenses: Expense[]): Promise<void> {
    validateUserId(userId, "cacheTripExpenses");
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
    validateUserId(userId, "getCachedTripExpenses");
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
    validateUserId(userId, "saveOfflineExpense");
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
    validateUserId(userId, "deleteOfflineExpense");
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

  // --- Offline Mutation Queue (Account Scoped) ---
  async queueOfflineMutation(userId: string, actionType: string, payload: any): Promise<void> {
    validateUserId(userId, "queueOfflineMutation");
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
    validateUserId(userId, "getPendingMutations");
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

  async removeMutation(userId: string, id: number): Promise<void> {
    validateUserId(userId, "removeMutation");
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      if (raw) {
        const list = JSON.parse(raw);
        memoryKv.set(
          "offline_mutation_queue",
          JSON.stringify(list.filter((m: any) => !(m.id === id && m.user_id === userId)))
        );
      }
      return;
    }
    await db.runAsync(`DELETE FROM offline_mutation_queue WHERE id = ? AND user_id = ?`, id, userId);
  },

  async cancelOfflineExpenseMutation(userId: string, offlineId: string): Promise<boolean> {
    validateUserId(userId, "cancelOfflineExpenseMutation");
    ensureMigrationReady();
    const db = await getDb();
    if (!db) {
      const raw = memoryKv.get("offline_mutation_queue");
      if (!raw) return false;
      const list = JSON.parse(raw);
      const filtered = list.filter((m: any) => {
        if (m.user_id !== userId || m.action_type !== "add_expense") return true;
        try {
          const payload = JSON.parse(m.payload_json);
          return payload.offlineId !== offlineId;
        } catch {
          return true;
        }
      });
      const removed = filtered.length !== list.length;
      if (removed) {
        memoryKv.set("offline_mutation_queue", JSON.stringify(filtered));
      }
      return removed;
    }

    const mutations = await db.getAllAsync<{ id: number; payload_json: string }>(
      `SELECT id, payload_json FROM offline_mutation_queue WHERE user_id = ? AND action_type = 'add_expense'`,
      userId
    );
    let cancelled = false;
    for (const m of mutations) {
      try {
        const payload = JSON.parse(m.payload_json);
        if (payload.offlineId === offlineId) {
          await db.runAsync(`DELETE FROM offline_mutation_queue WHERE id = ? AND user_id = ?`, m.id, userId);
          cancelled = true;
        }
      } catch {}
    }
    return cancelled;
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

  async _migrateTableToCompositePrimaryKeyForTesting(
    db: any,
    tableName: "user_trips_cache" | "trip_details_cache"
  ): Promise<void> {
    return migrateTableToCompositePrimaryKey(db, tableName);
  },
};
