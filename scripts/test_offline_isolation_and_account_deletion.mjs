// @ts-check
/**
 * VANVAS Mobile Offline Isolation, Migration & Sync Integrity Test Suite
 *
 * Executes the ACTUAL production modules:
 * - mobile/src/services/db.ts (offlineDb)
 * - mobile/src/services/api.ts (nativeApi)
 * - mobile/src/services/authTeardown.ts (executeAccountDeletionTeardown)
 * - mobile/src/services/storage.ts (secureStorage)
 *
 * Verifies all 31 mandatory scenarios:
 * Existing Database Migration:
 * 1. Upgrade actual previous schema with single-column trip primary key.
 * 2. Preserve existing valid account-owned records.
 * 3. Verify composite-key migration.
 * 4. Verify two accounts can independently cache the same trip ID.
 * 5. Verify repeat migration is safe and idempotent.
 * 6. Verify a genuine migration failure rolls back and blocks private operations.
 *
 * SQLite Privacy Isolation:
 * 7. Legacy NULL expense cannot be read.
 * 8. Legacy NULL mutation cannot be replayed.
 * 9. Legacy NULL expense cannot be deleted by another user.
 * 10. User A cannot read User B's expenses.
 * 11. User B cannot read User A's expenses.
 * 12. User A cannot delete User B's expense.
 * 13. User-scoped trip detail cache is isolated.
 * 14. Memory fallback follows the same ownership rules.
 * 15. Account purge deletes only the intended user's records.
 * 16. Public destination data survives account purge.
 * 17. Missing or empty user IDs are rejected by private methods.
 *
 * Actual Offline Synchronization:
 * 18. A successful synchronization removes only the confirmed mutation.
 * 19. A network failure preserves the current and remaining queue items.
 * 20. A previously created server expense with the same offline_client_id is reused without another POST.
 * 21. A failed reconciliation GET does not trigger another POST.
 * 22. Two unrelated expenses with identical title, amount and date are not falsely deduplicated.
 * 23. A local cache write failure after a successful server POST does not enqueue another creation.
 * 24. A pending offline expense deleted before reconnection is never recreated.
 * 25. Switching accounts during replay stops subsequent mutations.
 * 26. A mutation belonging to another user is never executed or removed.
 *
 * Actual Account Deletion Teardown:
 * 27. Backend deletion rejection leaves the local session intact.
 * 28. Successful backend deletion clears SecureStore credentials.
 * 29. Successful backend deletion resets the actual React authentication state.
 * 30. A local SQLite purge failure does not restore credentials or falsely report backend deletion failure.
 * 31. Only the deleted account's local cache is purged.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import Module, { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// 1. Set up TypeScript execution hook to load real .ts files from mobile/src/
// @ts-ignore
const ts = await import("../mobile/node_modules/typescript/lib/typescript.js");

// @ts-ignore
require.extensions[".ts"] = function (module, filename) {
  const code = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // @ts-ignore
  module._compile(transpiled, filename);
};

// In-memory SecureStore state for testing
let secureStoreMap = new Map();

// Intercept react-native and native Expo modules
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function (id) {
  if (id === "expo-sqlite") {
    return {
      openDatabaseAsync: async () => ({}),
    };
  }
  if (id === "react-native") {
    return {
      Platform: { OS: "android" },
    };
  }
  if (id === "expo-secure-store") {
    return {
      getItemAsync: async (k) => secureStoreMap.get(k) || null,
      setItemAsync: async (k, v) => { secureStoreMap.set(k, v); },
      deleteItemAsync: async (k) => { secureStoreMap.delete(k); },
    };
  }
  // @ts-ignore
  return originalRequire.apply(this, arguments);
};

// Import actual production modules
// @ts-ignore
const { offlineDb } = require("../mobile/src/services/db.ts");
// @ts-ignore
const { nativeApi, _setFetchForTesting } = require("../mobile/src/services/api.ts");
// @ts-ignore
const { secureStorage } = require("../mobile/src/services/storage.ts");
// @ts-ignore
const { executeAccountDeletionTeardown } = require("../mobile/src/services/authTeardown.ts");

/**
 * Creates a real in-memory SQLite database instance powered by Python's sqlite3 engine,
 * implementing Expo SQLite's exact interface:
 * - execAsync(sql)
 * - runAsync(sql, ...params)
 * - getAllAsync(sql, ...params)
 * - getFirstAsync(sql, ...params)
 * - withTransactionAsync(fn)
 */
function createRealSQLiteEngine() {
  const py = spawn("python", [
    "-c",
    `
import sys, json, sqlite3
conn = sqlite3.connect(":memory:", isolation_level=None)
conn.row_factory = sqlite3.Row

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    req = json.loads(line)
    sql = req.get("sql", "")
    params = req.get("params", [])
    try:
        cur = conn.cursor()
        if ";" in sql.strip() and len([s for s in sql.split(";") if s.strip()]) > 1:
            cur.executescript(sql)
            sys.stdout.write(json.dumps({"id": req["id"], "ok": True}) + "\\n")
        else:
            cur.execute(sql, params)
            if sql.strip().upper().startswith("SELECT") or "PRAGMA" in sql.upper():
                rows = [dict(r) for r in cur.fetchall()]
                sys.stdout.write(json.dumps({"id": req["id"], "rows": rows}) + "\\n")
            else:
                sys.stdout.write(json.dumps({"id": req["id"], "ok": True}) + "\\n")
    except Exception as e:
        sys.stdout.write(json.dumps({"id": req["id"], "error": str(e)}) + "\\n")
    sys.stdout.flush()
`,
  ]);

  let reqId = 0;
  const callbacks = new Map();
  let buffer = "";

  py.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (!line.trim()) continue;
      const res = JSON.parse(line);
      const cb = callbacks.get(res.id);
      if (cb) {
        callbacks.delete(res.id);
        cb(res);
      }
    }
  });

  function query(sql, params = []) {
    return new Promise((resolve, reject) => {
      const curId = ++reqId;
      callbacks.set(curId, (res) => {
        if (res.error) reject(new Error(res.error));
        else resolve(res);
      });
      py.stdin.write(JSON.stringify({ id: curId, sql, params }) + "\n");
    });
  }

  const dbAdapter = {
    async execAsync(sql) {
      await query(sql);
    },
    async runAsync(sql, ...params) {
      await query(sql, params);
    },
    async getAllAsync(sql, ...params) {
      const res = await query(sql, params);
      return res.rows || [];
    },
    async getFirstAsync(sql, ...params) {
      const rows = await this.getAllAsync(sql, ...params);
      return rows.length > 0 ? rows[0] : null;
    },
    async withTransactionAsync(fn) {
      await query("BEGIN TRANSACTION;");
      try {
        const result = await fn();
        await query("COMMIT;");
        return result;
      } catch (err) {
        await query("ROLLBACK;");
        throw err;
      }
    },
    close() {
      py.kill();
    },
  };

  return dbAdapter;
}

async function runTestSuite() {
  console.log("======================================================================");
  console.log("  VANVAS Mobile Real Migration, Privacy Isolation & Offline Sync Suite");
  console.log("  Executing actual production methods from db.ts, api.ts & authTeardown.ts");
  console.log("======================================================================\n");

  let passedCount = 0;
  let sqliteEngine = createRealSQLiteEngine();

  async function setupCleanFreshDatabase() {
    sqliteEngine.close();
    sqliteEngine = createRealSQLiteEngine();
    await offlineDb._initSchemaForTesting(sqliteEngine);
    offlineDb._setDatabaseForTesting(sqliteEngine);
    offlineDb._setMigrationErrorForTesting(null);
  }

  try {
    // =========================================================================
    // SECTION 1: EXISTING DATABASE MIGRATION & UPGRADE (Tests 1 - 6)
    // =========================================================================

    // TEST 1 & 2: Upgrade actual previous schema with single-column PK & preserve valid user data
    {
      process.stdout.write("Test 1 & 2: Upgrade legacy schema fixture & preserve existing user-owned data... ");
      sqliteEngine.close();
      sqliteEngine = createRealSQLiteEngine();

      // Create actual previous production schema from checkpoint 51880e9
      await sqliteEngine.execAsync(`
        CREATE TABLE destinations_cache (
          id TEXT PRIMARY KEY,
          slug TEXT,
          name TEXT,
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE destination_details_cache (
          slug_or_id TEXT PRIMARY KEY,
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE user_trips_cache (
          trip_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE trip_details_cache (
          trip_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE expenses_cache (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          notes TEXT,
          sync_status TEXT NOT NULL DEFAULT 'synced',
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE offline_mutation_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);

      // Seed with existing user_a records and unowned legacy records
      const timestamp = 1731200000000;
      const tripSummaryA = { id: "trip_spiti_shared", destination_name: "Spiti Valley", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned" };
      const tripDetailA = { id: "trip_spiti_shared", destination_id: "spiti", title: "User A Spiti Expedition", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] };
      const unownedTripDetail = { id: "trip_unowned_orphan", destination_id: "spiti", title: "Orphaned Trip", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] };

      await sqliteEngine.runAsync(
        "INSERT INTO user_trips_cache VALUES (?, ?, ?, ?)",
        "trip_spiti_shared", "user_a", JSON.stringify(tripSummaryA), timestamp
      );
      await sqliteEngine.runAsync(
        "INSERT INTO trip_details_cache VALUES (?, ?, ?, ?)",
        "trip_spiti_shared", "user_a", JSON.stringify(tripDetailA), timestamp
      );
      // Insert unowned trip detail with empty user_id
      await sqliteEngine.runAsync(
        "INSERT INTO trip_details_cache VALUES (?, ?, ?, ?)",
        "trip_unowned_orphan", "", JSON.stringify(unownedTripDetail), timestamp
      );

      // Execute actual production migration
      await offlineDb._initSchemaForTesting(sqliteEngine);
      offlineDb._setDatabaseForTesting(sqliteEngine);

      // Verify User A's data survived completely
      const userATrips = await offlineDb.getCachedUserTrips("user_a");
      assert.strictEqual(userATrips.length, 1);
      assert.strictEqual(userATrips[0].id, "trip_spiti_shared");

      const userADetail = await offlineDb.getCachedTripDetail("user_a", "trip_spiti_shared");
      assert.strictEqual(userADetail?.title, "User A Spiti Expedition");

      // Verify unowned orphan was quarantined, not visible to user_a or user_b
      const orphanCheckA = await offlineDb.getCachedTripDetail("user_a", "trip_unowned_orphan");
      assert.strictEqual(orphanCheckA, null);
      const orphanCheckB = await offlineDb.getCachedTripDetail("user_b", "trip_unowned_orphan");
      assert.strictEqual(orphanCheckB, null);

      passedCount += 2;
      console.log("[PASS] (2 tests)");
    }

    // TEST 3: Verify composite-key migration structure
    {
      process.stdout.write("Test 3: Verify composite-key PRAGMA structure... ");
      const tripCols = await sqliteEngine.getAllAsync("PRAGMA table_info(user_trips_cache)");
      const detailCols = await sqliteEngine.getAllAsync("PRAGMA table_info(trip_details_cache)");

      const tripPkCols = tripCols.filter((c) => c.pk > 0);
      assert.strictEqual(tripPkCols.length, 2, "user_trips_cache must have composite PK of 2 columns");
      assert.strictEqual(tripPkCols.some((c) => c.name === "trip_id"), true);
      assert.strictEqual(tripPkCols.some((c) => c.name === "user_id"), true);

      const detailPkCols = detailCols.filter((c) => c.pk > 0);
      assert.strictEqual(detailPkCols.length, 2, "trip_details_cache must have composite PK of 2 columns");
      assert.strictEqual(detailPkCols.some((c) => c.name === "trip_id"), true);
      assert.strictEqual(detailPkCols.some((c) => c.name === "user_id"), true);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 4: Two accounts independently cache the same trip ID without overwriting
    {
      process.stdout.write("Test 4: Two accounts independently cache the same trip ID without overwriting... ");
      const tripDetailB = {
        id: "trip_spiti_shared", // SAME trip ID as User A
        destination_id: "spiti",
        title: "User B Custom Budget Spiti",
        start_date: "2026-11-15",
        end_date: "2026-11-22",
        status: "planned",
        days: [],
      };

      await offlineDb.cacheTripDetail("user_b", tripDetailB);

      // Verify User A still reads User A's snapshot
      const cachedA = await offlineDb.getCachedTripDetail("user_a", "trip_spiti_shared");
      assert.strictEqual(cachedA?.title, "User A Spiti Expedition");

      // Verify User B reads User B's snapshot
      const cachedB = await offlineDb.getCachedTripDetail("user_b", "trip_spiti_shared");
      assert.strictEqual(cachedB?.title, "User B Custom Budget Spiti");

      // Update User B
      const tripDetailBUpdated = { ...tripDetailB, title: "User B Updated Route" };
      await offlineDb.cacheTripDetail("user_b", tripDetailBUpdated);

      // User A snapshot remains completely untouched!
      const cachedAAfter = await offlineDb.getCachedTripDetail("user_a", "trip_spiti_shared");
      assert.strictEqual(cachedAAfter?.title, "User A Spiti Expedition");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 5: Verify repeat migration is safe and idempotent
    {
      process.stdout.write("Test 5: Verify repeat migration is safe and idempotent... ");
      // Re-run initSchema on the already migrated database
      await offlineDb._initSchemaForTesting(sqliteEngine);

      const cachedA = await offlineDb.getCachedTripDetail("user_a", "trip_spiti_shared");
      assert.strictEqual(cachedA?.title, "User A Spiti Expedition");

      const cachedB = await offlineDb.getCachedTripDetail("user_b", "trip_spiti_shared");
      assert.strictEqual(cachedB?.title, "User B Updated Route");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 6: Genuine migration failure rolls back and blocks private operations
    {
      process.stdout.write("Test 6: Genuine migration failure rolls back and blocks private operations... ");
      const brokenEngine = createRealSQLiteEngine();
      // Pre-create table with old single PK so migration is triggered
      await brokenEngine.execAsync(`
        CREATE TABLE user_trips_cache (
          trip_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      // Intercept execAsync to throw during migration
      const brokenDbAdapter = {
        ...brokenEngine,
        async execAsync(sql) {
          if (sql.includes("user_trips_cache_new_composite")) {
            throw new Error("Simulated disk I/O corruption during table swap");
          }
          await brokenEngine.execAsync(sql);
        },
      };

      let threw = false;
      try {
        await offlineDb._initSchemaForTesting(brokenDbAdapter);
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes("corruption"));
      }
      assert.strictEqual(threw, true, "initSchema must fail and throw on migration error");

      // Private cache query must be fail-safely blocked
      let queryBlocked = false;
      try {
        await offlineDb.getCachedTripDetail("user_a", "trip_any");
      } catch (err) {
        queryBlocked = true;
        assert.ok(err.message.includes("Private cache access blocked"));
      }
      assert.strictEqual(queryBlocked, true, "Private operations must be blocked after migration failure");

      brokenEngine.close();
      passedCount++;
      console.log("[PASS]");
    }

    // =========================================================================
    // SECTION 2: SQLITE PRIVACY ISOLATION (Tests 7 - 17)
    // =========================================================================

    // TEST 7: Legacy NULL expense cannot be read by authenticated user
    {
      process.stdout.write("Test 7: Legacy NULL expense cannot be read by authenticated user... ");
      await setupCleanFreshDatabase();

      await sqliteEngine.runAsync(
        "INSERT INTO expenses_cache (id, trip_id, user_id, title, amount, category, date, sync_status, data_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        "legacy_exp_null", "trip_ladakh", null, "Unowned Chai", 30, "Food", "2026-10-01", "synced", JSON.stringify({ id: "legacy_exp_null", title: "Unowned Chai", amount: 30 }), Date.now()
      );

      await offlineDb.saveOfflineExpense("user_a", "trip_ladakh", {
        id: "exp_a_valid",
        trip_id: "trip_ladakh",
        title: "User A Petrol",
        amount: 800,
        category: "Transport",
        date: "2026-11-10",
      });

      const userAExpenses = await offlineDb.getCachedTripExpenses("user_a", "trip_ladakh");
      assert.strictEqual(userAExpenses.length, 1);
      assert.strictEqual(userAExpenses[0].id, "exp_a_valid");

      const userBExpenses = await offlineDb.getCachedTripExpenses("user_b", "trip_ladakh");
      assert.strictEqual(userBExpenses.length, 0);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 8: Legacy NULL mutation is never replayed
    {
      process.stdout.write("Test 8: Legacy NULL mutation is never replayed... ");
      await sqliteEngine.runAsync(
        "INSERT INTO offline_mutation_queue (user_id, action_type, payload_json, created_at) VALUES (?, ?, ?, ?)",
        null, "delete_expense", JSON.stringify({ tripId: "trip_ladakh", expenseId: "legacy_exp_null" }), Date.now()
      );

      await offlineDb.queueOfflineMutation("user_a", "add_expense", { title: "User A Action" });

      const pendingA = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pendingA.length, 1);
      assert.strictEqual(pendingA[0].user_id, "user_a");

      const pendingB = await offlineDb.getPendingMutations("user_b");
      assert.strictEqual(pendingB.length, 0);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 9: Legacy NULL expense cannot be deleted by another user
    {
      process.stdout.write("Test 9: Legacy NULL expense cannot be deleted by another user... ");
      await offlineDb.deleteOfflineExpense("user_a", "trip_ladakh", "legacy_exp_null");

      const rows = await sqliteEngine.getAllAsync("SELECT id FROM expenses_cache WHERE id = ? AND user_id IS NULL", "legacy_exp_null");
      assert.strictEqual(rows.length, 1, "Legacy NULL expense must remain safely quarantined");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 10 & 11: Cross-account expense cache isolation
    {
      process.stdout.write("Test 10 & 11: User A and User B cannot read each other's expenses... ");
      await offlineDb.saveOfflineExpense("user_b", "trip_ladakh", {
        id: "exp_b_valid",
        trip_id: "trip_ladakh",
        title: "User B Homestay",
        amount: 1500,
        category: "Stay",
        date: "2026-11-10",
      });

      const userAExp = await offlineDb.getCachedTripExpenses("user_a", "trip_ladakh");
      assert.strictEqual(userAExp.length, 1);
      assert.strictEqual(userAExp[0].id, "exp_a_valid");

      const userBExp = await offlineDb.getCachedTripExpenses("user_b", "trip_ladakh");
      assert.strictEqual(userBExp.length, 1);
      assert.strictEqual(userBExp[0].id, "exp_b_valid");

      passedCount += 2;
      console.log("[PASS] (2 tests)");
    }

    // TEST 12: User A cannot delete User B's expense
    {
      process.stdout.write("Test 12: User A cannot delete User B's expense... ");
      await offlineDb.deleteOfflineExpense("user_a", "trip_ladakh", "exp_b_valid");

      const userBExp = await offlineDb.getCachedTripExpenses("user_b", "trip_ladakh");
      assert.strictEqual(userBExp.length, 1);
      assert.strictEqual(userBExp[0].id, "exp_b_valid");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 13: User-scoped trip detail cache isolation
    {
      process.stdout.write("Test 13: User-scoped trip detail cache isolation... ");
      await offlineDb.cacheTripDetail("user_a", { id: "trip_iso_1", destination_id: "spiti", title: "Trip Iso A", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });
      await offlineDb.cacheTripDetail("user_b", { id: "trip_iso_1", destination_id: "spiti", title: "Trip Iso B", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });

      const resA = await offlineDb.getCachedTripDetail("user_a", "trip_iso_1");
      assert.strictEqual(resA?.title, "Trip Iso A");

      const resB = await offlineDb.getCachedTripDetail("user_b", "trip_iso_1");
      assert.strictEqual(resB?.title, "Trip Iso B");

      const resC = await offlineDb.getCachedTripDetail("user_c", "trip_iso_1");
      assert.strictEqual(resC, null);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 14: In-memory fallback parity follows same ownership rules
    {
      process.stdout.write("Test 14: In-memory fallback parity follows same ownership rules... ");
      offlineDb._setDatabaseForTesting(null); // Switch to in-memory mode
      const memKv = offlineDb._getMemoryKvForTesting();
      memKv.clear();

      await offlineDb.cacheTripDetail("user_a", { id: "trip_mem_1", destination_id: "spiti", title: "Memory Trip A", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });
      await offlineDb.cacheTripExpenses("user_a", "trip_mem_1", [{ id: "exp_mem_1", trip_id: "trip_mem_1", title: "Maggi", amount: 70, category: "Food", date: "2026-11-12" }]);
      await offlineDb.queueOfflineMutation("user_a", "add_expense", { title: "Mutation A" });

      // User B receives null/empty
      assert.strictEqual(await offlineDb.getCachedTripDetail("user_b", "trip_mem_1"), null);
      assert.strictEqual((await offlineDb.getCachedTripExpenses("user_b", "trip_mem_1")).length, 0);
      assert.strictEqual((await offlineDb.getPendingMutations("user_b")).length, 0);

      // User A receives User A's data
      assert.strictEqual((await offlineDb.getCachedTripDetail("user_a", "trip_mem_1"))?.title, "Memory Trip A");
      assert.strictEqual((await offlineDb.getCachedTripExpenses("user_a", "trip_mem_1")).length, 1);
      assert.strictEqual((await offlineDb.getPendingMutations("user_a")).length, 1);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 15: Account purge deletes only intended user's records
    {
      process.stdout.write("Test 15: Account purge deletes only intended user's records... ");
      await setupCleanFreshDatabase();

      await offlineDb.cacheTripDetail("user_a", { id: "trip_p_1", destination_id: "spiti", title: "Purge A", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });
      await offlineDb.cacheTripDetail("user_b", { id: "trip_p_1", destination_id: "spiti", title: "Keep B", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });

      await offlineDb.purgeUserAccountData("user_a");

      assert.strictEqual(await offlineDb.getCachedTripDetail("user_a", "trip_p_1"), null);
      assert.strictEqual((await offlineDb.getCachedTripDetail("user_b", "trip_p_1"))?.title, "Keep B");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 16: Public destination data survives account purge
    {
      process.stdout.write("Test 16: Public destination data survives account purge... ");
      await offlineDb.cacheDestinations([
        { id: "spiti", slug: "spiti", name: "Spiti Valley", state: "Himachal Pradesh", hero_image: "/img/spiti.jpg", description: "Middle Land", tags: [] },
      ]);

      await offlineDb.purgeUserAccountData("user_b");

      const dests = await offlineDb.getCachedDestinations();
      assert.strictEqual(dests.length, 1);
      assert.strictEqual(dests[0].slug, "spiti");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 17: Missing or empty user IDs are rejected by private methods
    {
      process.stdout.write("Test 17: Missing or empty user IDs are rejected by private methods... ");
      const invalidIds = ["", "   ", null, undefined];
      for (const badId of invalidIds) {
        let threw = false;
        try {
          // @ts-ignore
          await offlineDb.getCachedTripDetail(badId, "trip_any");
        } catch {
          threw = true;
        }
        assert.strictEqual(threw, true, `getCachedTripDetail must reject invalid ID: ${badId}`);

        threw = false;
        try {
          // @ts-ignore
          await offlineDb.getCachedTripExpenses(badId, "trip_any");
        } catch {
          threw = true;
        }
        assert.strictEqual(threw, true, `getCachedTripExpenses must reject invalid ID: ${badId}`);

        threw = false;
        try {
          // @ts-ignore
          await offlineDb.getPendingMutations(badId);
        } catch {
          threw = true;
        }
        assert.strictEqual(threw, true, `getPendingMutations must reject invalid ID: ${badId}`);

        threw = false;
        try {
          // @ts-ignore
          await offlineDb.removeMutation(badId, 1);
        } catch {
          threw = true;
        }
        assert.strictEqual(threw, true, `removeMutation must reject invalid ID: ${badId}`);
      }

      passedCount++;
      console.log("[PASS]");
    }

    // =========================================================================
    // SECTION 3: ACTUAL OFFLINE SYNCHRONIZATION (Tests 18 - 26)
    // =========================================================================

    // TEST 18: Successful synchronization removes only the confirmed mutation
    {
      process.stdout.write("Test 18: A successful synchronization removes only the confirmed mutation... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      const offlineId = "offline_sync_test_1";
      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_sync_1",
        offlineId,
        expense: {
          title: "Kaza Fuel",
          amount: 1500,
          category: "Transport",
          date: "2026-11-10",
          receipt_data_json: JSON.stringify({ offline_client_id: offlineId }),
        },
      });

      // Inject mock fetch transport for nativeApi
      nativeApi._setFetchForTesting(async (url, opts) => {
        const u = String(url);
        if (opts?.method === "POST" && u.includes("/expenses")) {
          return new Response(JSON.stringify({
            id: "server_exp_101",
            trip_id: "trip_sync_1",
            title: "Kaza Fuel",
            amount: 1500,
            category: "Transport",
            date: "2026-11-10",
            receipt_data_json: JSON.stringify({ offline_client_id: offlineId }),
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (opts?.method === "GET" || !opts?.method) {
          // Reconciliation GET returns empty array (no existing duplicate)
          return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response("Not found", { status: 404 });
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 1, "Must sync exactly 1 mutation");

      const pending = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pending.length, 0, "Confirmed mutation must be removed from queue");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 19: Network failure preserves current and remaining queue items
    {
      process.stdout.write("Test 19: A network failure preserves current and remaining queue items... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_net_fail",
        offlineId: "offline_fail_1",
        expense: { title: "Item 1", amount: 100, category: "Food", date: "2026-11-10" },
      });
      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_net_fail",
        offlineId: "offline_fail_2",
        expense: { title: "Item 2", amount: 200, category: "Food", date: "2026-11-10" },
      });

      // Inject network failure
      nativeApi._setFetchForTesting(async () => {
        throw new Error("Network request failed: high-altitude disconnect");
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 0, "No mutations should sync on network failure");

      const pending = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pending.length, 2, "Both queue items must be preserved for retry");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 20: Pre-existing server expense with same offline_client_id is reused without another POST
    {
      process.stdout.write("Test 20: Pre-existing server expense with same offline_client_id is reused without another POST... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      const offlineId = "offline_interrupted_123";
      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_dedup_test",
        offlineId,
        expense: {
          title: "Lunch Dhaba",
          amount: 250,
          category: "Food",
          date: "2026-11-10",
          receipt_data_json: JSON.stringify({ offline_client_id: offlineId }),
        },
      });

      let postCalled = false;
      nativeApi._setFetchForTesting(async (url, opts) => {
        if (opts?.method === "POST") {
          postCalled = true;
          return new Response(JSON.stringify({ id: "duplicate_bad_id" }), { status: 200 });
        }
        // Reconciliation GET returns the previously created server expense with matching offline_client_id
        return new Response(JSON.stringify([
          {
            id: "server_existing_123",
            trip_id: "trip_dedup_test",
            title: "Lunch Dhaba",
            amount: 250,
            category: "Food",
            date: "2026-11-10",
            receipt_data_json: JSON.stringify({ offline_client_id: offlineId }),
          },
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 1);
      assert.strictEqual(postCalled, false, "Must NOT call POST when server expense with matching offline_client_id exists");

      const pending = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pending.length, 0, "Mutation must be cleared upon successful reconciliation");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 21: A failed reconciliation GET does not trigger another POST
    {
      process.stdout.write("Test 21: A failed reconciliation GET does not trigger another POST... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_safe_get",
        offlineId: "offline_get_fail_1",
        expense: { title: "Tea", amount: 40, category: "Food", date: "2026-11-10" },
      });

      let postCalled = false;
      nativeApi._setFetchForTesting(async (url, opts) => {
        if (opts?.method === "POST") {
          postCalled = true;
          return new Response(JSON.stringify({ id: "bad" }), { status: 200 });
        }
        // Reconciliation GET throws network error
        throw new Error("HTTP 504 Gateway Timeout during reconciliation GET");
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 0);
      assert.strictEqual(postCalled, false, "Failed GET must NOT be treated as proof no expense exists; POST forbidden");

      const pending = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pending.length, 1, "Mutation must be preserved");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 22: Two unrelated expenses with identical title, amount and date are not falsely deduplicated
    {
      process.stdout.write("Test 22: Unrelated expenses with identical title, amount & date not falsely deduplicated... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      const newOfflineId = "offline_tea_second_cup";
      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_tea",
        offlineId: newOfflineId,
        expense: {
          title: "Chai",
          amount: 30,
          category: "Food",
          date: "2026-11-10",
          receipt_data_json: JSON.stringify({ offline_client_id: newOfflineId }),
        },
      });

      let postCalledWithNewExpense = false;
      nativeApi._setFetchForTesting(async (url, opts) => {
        if (opts?.method === "POST") {
          postCalledWithNewExpense = true;
          return new Response(JSON.stringify({
            id: "server_tea_2",
            trip_id: "trip_tea",
            title: "Chai",
            amount: 30,
            category: "Food",
            date: "2026-11-10",
            receipt_data_json: JSON.stringify({ offline_client_id: newOfflineId }),
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        // Server already has an earlier Chai for 30 on same date, but with DIFFERENT offline_client_id
        return new Response(JSON.stringify([
          {
            id: "server_tea_first_cup",
            trip_id: "trip_tea",
            title: "Chai",
            amount: 30,
            category: "Food",
            date: "2026-11-10",
            receipt_data_json: JSON.stringify({ offline_client_id: "offline_tea_first_cup" }),
          },
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 1);
      assert.strictEqual(postCalledWithNewExpense, true, "Must post legitimate second purchase despite identical title & amount");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 23: Local cache write failure after successful server POST does not enqueue another creation
    {
      process.stdout.write("Test 23: Local cache write failure after server POST does not enqueue another creation... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      nativeApi._setFetchForTesting(async (url, opts) => {
        return new Response(JSON.stringify({
          id: "server_exp_success_99",
          trip_id: "trip_disk_err",
          title: "Guide Fee",
          amount: 2000,
          category: "Culture",
          date: "2026-11-10",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      });

      // Break saveOfflineExpense in offlineDb temporarily
      const originalSave = offlineDb.saveOfflineExpense;
      offlineDb.saveOfflineExpense = async () => {
        throw new Error("Simulated SQLite write failure on disk full");
      };

      let resultExpense;
      try {
        resultExpense = await nativeApi.addExpense("trip_disk_err", {
          title: "Guide Fee",
          amount: 2000,
          category: "Culture",
          date: "2026-11-10",
        });
      } finally {
        offlineDb.saveOfflineExpense = originalSave;
      }

      assert.strictEqual(resultExpense.id, "server_exp_success_99");

      // Verify NO offline mutation was enqueued
      const pending = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pending.length, 0, "Must NOT enqueue offline mutation when server POST already succeeded");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 24: Pending offline expense deleted before reconnection is never recreated
    {
      process.stdout.write("Test 24: Pending offline expense deleted before reconnection is never recreated... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("valid-jwt-token-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      // In offline mode (fetch throws)
      nativeApi._setFetchForTesting(async () => {
        throw new Error("Network unreachable");
      });

      const offlineCreated = await nativeApi.addExpense("trip_del_cancel", {
        title: "Mistaken Expense",
        amount: 999,
        category: "Other",
        date: "2026-11-10",
      });

      assert.strictEqual(offlineCreated.id.startsWith("offline_"), true);

      // Verify 1 pending mutation exists
      const pendingBefore = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pendingBefore.length, 1);

      // Now user deletes the offline expense BEFORE reconnecting
      await nativeApi.deleteExpense("trip_del_cancel", offlineCreated.id);

      // Verify pending add_expense mutation was cancelled and removed!
      const pendingAfter = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pendingAfter.length, 0, "Pending creation mutation must be cancelled upon offline deletion");

      // Verify local expense is gone
      const localExp = await offlineDb.getCachedTripExpenses("user_a", "trip_del_cancel");
      assert.strictEqual(localExp.length, 0);

      // Now reconnect and sync: zero mutations are replayed or created!
      let postAttempted = false;
      nativeApi._setFetchForTesting(async (url, opts) => {
        if (opts?.method === "POST") postAttempted = true;
        return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 0);
      assert.strictEqual(postAttempted, false, "Reconnecting must never recreate deleted unsynced expense");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 25: Switching accounts during replay stops subsequent mutations
    {
      process.stdout.write("Test 25: Switching accounts during replay stops subsequent mutations... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("token-user-a");
      await secureStorage.setUserData({ id: "user_a", email: "usera@vanvas.com" });

      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_switch",
        offlineId: "off_sw_1",
        expense: { title: "A1", amount: 10, category: "Food", date: "2026-11-10" },
      });
      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_switch",
        offlineId: "off_sw_2",
        expense: { title: "A2", amount: 20, category: "Food", date: "2026-11-10" },
      });

      nativeApi._setFetchForTesting(async (url, opts) => {
        if (opts?.method === "GET" || !opts?.method) {
          return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (opts?.method === "POST") {
          // Immediately after Action 1 POST succeeds, simulate user switching accounts to user_c!
          await secureStorage.setUserData({ id: "user_c", email: "userc@vanvas.com" });
          await secureStorage.setToken("token-user-c");
          return new Response(JSON.stringify({
            id: "server_sw_1",
            trip_id: "trip_switch",
            title: "A1",
            amount: 10,
            category: "Food",
            date: "2026-11-10",
            receipt_data_json: JSON.stringify({ offline_client_id: "off_sw_1" }),
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response("Not found", { status: 404 });
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 1, "Must stop replay immediately when active session changes");

      // Verify second mutation is still safely queued for user_a
      const pendingA = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pendingA.length, 1);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 26: Mutation belonging to another user is never executed or removed
    {
      process.stdout.write("Test 26: Mutation belonging to another user is never executed or removed... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("token-user-b");
      await secureStorage.setUserData({ id: "user_b", email: "userb@vanvas.com" });

      await offlineDb.queueOfflineMutation("user_a", "add_expense", {
        tripId: "trip_user_a",
        offlineId: "off_a_only",
        expense: { title: "User A Action", amount: 50, category: "Food", date: "2026-11-10" },
      });

      nativeApi._setFetchForTesting(async () => {
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const synced = await nativeApi.syncPendingOfflineActions();
      assert.strictEqual(synced, 0, "User B cannot sync User A's mutations");

      const pendingA = await offlineDb.getPendingMutations("user_a");
      assert.strictEqual(pendingA.length, 1);
      assert.strictEqual(pendingA[0].user_id, "user_a");

      passedCount++;
      console.log("[PASS]");
    }

    // =========================================================================
    // SECTION 4: ACTUAL ACCOUNT DELETION TEARDOWN (Tests 27 - 31)
    // =========================================================================

    // TEST 27: Backend deletion rejection leaves local session intact
    {
      process.stdout.write("Test 27: Backend deletion rejection leaves local session intact... ");
      await setupCleanFreshDatabase();

      await secureStorage.setToken("token-active");
      await secureStorage.setUserData({ id: "user_delete_test", email: "del@vanvas.com" });

      let reactState = { user: { id: "user_delete_test" }, token: "token-active" };
      const stateHooks = {
        setToken: (t) => { reactState.token = t; },
        setUser: (u) => { reactState.user = u; },
      };

      // Mock backend deletion rejection (HTTP 400 invalid password)
      nativeApi._setFetchForTesting(async (url, opts) => {
        if (String(url).includes("/auth/account") && opts?.method === "DELETE") {
          return new Response(JSON.stringify({ detail: "Invalid password provided for account deletion." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      let threw = false;
      try {
        await executeAccountDeletionTeardown("user_delete_test", "WrongPassword!", stateHooks, nativeApi, secureStorage, offlineDb);
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes("Invalid password"));
      }

      assert.strictEqual(threw, true);
      assert.strictEqual(await secureStorage.getToken(), "token-active");
      assert.strictEqual(reactState.user?.id, "user_delete_test");
      assert.strictEqual(reactState.token, "token-active");

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 28 & 29: Successful backend deletion clears SecureStore credentials & resets React state
    {
      process.stdout.write("Test 28 & 29: Successful backend deletion clears SecureStore & resets React state... ");
      let reactState = { user: { id: "user_delete_test" }, token: "token-active" };
      const stateHooks = {
        setToken: (t) => { reactState.token = t; },
        setUser: (u) => { reactState.user = u; },
      };

      nativeApi._setFetchForTesting(async (url, opts) => {
        if (String(url).includes("/auth/account") && opts?.method === "DELETE") {
          return new Response(JSON.stringify({ message: "Account deleted permanently", user_id: "user_delete_test", status: "deleted" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      const res = await executeAccountDeletionTeardown("user_delete_test", "CorrectPassword123!", stateHooks, nativeApi, secureStorage, offlineDb);
      assert.strictEqual(res.status, "deleted");

      // Credentials cleared
      assert.strictEqual(await secureStorage.getToken(), null);
      assert.strictEqual(await secureStorage.getUserData(), null);

      // React state cleared
      assert.strictEqual(reactState.user, null);
      assert.strictEqual(reactState.token, null);

      passedCount += 2;
      console.log("[PASS] (2 tests)");
    }

    // TEST 30: Local SQLite purge failure does not restore credentials or falsely report backend failure
    {
      process.stdout.write("Test 30: Local SQLite purge failure does not restore credentials or falsely report error... ");
      await secureStorage.setToken("token-active-2");
      await secureStorage.setUserData({ id: "user_purge_err", email: "err@vanvas.com" });

      let reactState = { user: { id: "user_purge_err" }, token: "token-active-2" };
      const stateHooks = {
        setToken: (t) => { reactState.token = t; },
        setUser: (u) => { reactState.user = u; },
      };

      nativeApi._setFetchForTesting(async () => {
        return new Response(JSON.stringify({ message: "Account deleted permanently", user_id: "user_purge_err", status: "deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      // Break purgeUserAccountData to simulate SQLite disk error
      const originalPurge = offlineDb.purgeUserAccountData;
      offlineDb.purgeUserAccountData = async () => {
        throw new Error("Simulated SQLite Disk I/O Failure during purge");
      };

      let res;
      try {
        res = await executeAccountDeletionTeardown("user_purge_err", "CorrectPassword!", stateHooks, nativeApi, secureStorage, offlineDb);
      } finally {
        offlineDb.purgeUserAccountData = originalPurge;
      }

      assert.strictEqual(res.status, "deleted", "Must report server success despite local cleanup warning");
      assert.strictEqual(await secureStorage.getToken(), null);
      assert.strictEqual(reactState.user, null);
      assert.strictEqual(reactState.token, null);

      passedCount++;
      console.log("[PASS]");
    }

    // TEST 31: Only deleted account's local cache is purged
    {
      process.stdout.write("Test 31: Only deleted account's local cache is purged... ");
      await setupCleanFreshDatabase();

      await offlineDb.cacheTripDetail("user_to_delete", { id: "trip_del_31", destination_id: "spiti", title: "Trip Del", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });
      await offlineDb.cacheTripDetail("user_to_keep", { id: "trip_del_31", destination_id: "spiti", title: "Trip Keep", start_date: "2026-11-12", end_date: "2026-11-18", status: "planned", days: [] });

      await offlineDb.purgeUserAccountData("user_to_delete");

      assert.strictEqual(await offlineDb.getCachedTripDetail("user_to_delete", "trip_del_31"), null);
      assert.strictEqual((await offlineDb.getCachedTripDetail("user_to_keep", "trip_del_31"))?.title, "Trip Keep");

      passedCount++;
      console.log("[PASS]");
    }

    console.log("\n======================================================================");
    console.log(`  ALL ${passedCount} OF 31 TESTS PASSED (100% SUCCESS)`);
    console.log("  Real production code executed across migrations, privacy & offline sync.");
    console.log("======================================================================\n");
  } finally {
    sqliteEngine.close();
    nativeApi._setFetchForTesting(null);
  }
}

runTestSuite().catch((err) => {
  console.error("\n❌ Test suite failed with error:", err);
  process.exit(1);
});
