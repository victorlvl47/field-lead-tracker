import { describe, expect, it } from "vitest";

import {
  isRemoteNewerThanLastSync,
  shouldMarkPendingUpdateAsConflict,
} from "../conflictUtils";

describe("isRemoteNewerThanLastSync", () => {
  it("returns true when remote updated_at is newer than local last_synced_at", () => {
    expect(
      isRemoteNewerThanLastSync(
        "2026-07-06T12:01:00.000Z",
        "2026-07-06T12:00:00.000Z",
      ),
    ).toBe(true);
  });

  it("returns false when remote updated_at is the same as local last_synced_at", () => {
    expect(
      isRemoteNewerThanLastSync(
        "2026-07-06T12:00:00.000Z",
        "2026-07-06T12:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("returns false when remote updated_at is older than local last_synced_at", () => {
    expect(
      isRemoteNewerThanLastSync(
        "2026-07-06T11:59:00.000Z",
        "2026-07-06T12:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("returns false when remote updated_at is invalid", () => {
    expect(
      isRemoteNewerThanLastSync("not-a-date", "2026-07-06T12:00:00.000Z"),
    ).toBe(false);
  });

  it("returns false when remote updated_at is missing", () => {
    expect(isRemoteNewerThanLastSync(null, "2026-07-06T12:00:00.000Z")).toBe(
      false,
    );
  });

  it("returns false when local last_synced_at is missing", () => {
    expect(isRemoteNewerThanLastSync("2026-07-06T12:01:00.000Z", null)).toBe(
      false,
    );
  });

  it("returns false when local last_synced_at is invalid", () => {
    expect(
      isRemoteNewerThanLastSync("2026-07-06T12:01:00.000Z", "not-a-date"),
    ).toBe(false);
  });
});

describe("shouldMarkPendingUpdateAsConflict", () => {
  it("returns true when remote lead changed after last sync", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: "2026-07-06T12:01:00.000Z",
        lastSyncedAt: "2026-07-06T12:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("returns false when remote updated_at is same as last_synced_at", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: "2026-07-06T12:00:00.000Z",
        lastSyncedAt: "2026-07-06T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("returns false when remote updated_at is older than last_synced_at", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: "2026-07-06T11:59:00.000Z",
        lastSyncedAt: "2026-07-06T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("returns false when remote updated_at is missing", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: null,
        lastSyncedAt: "2026-07-06T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("returns false when last_synced_at is missing", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: "2026-07-06T12:01:00.000Z",
        lastSyncedAt: null,
      }),
    ).toBe(false);
  });

  it("returns false when remote updated_at is invalid", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: "not-a-date",
        lastSyncedAt: "2026-07-06T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("returns false when last_synced_at is invalid", () => {
    expect(
      shouldMarkPendingUpdateAsConflict({
        remoteUpdatedAt: "2026-07-06T12:01:00.000Z",
        lastSyncedAt: "not-a-date",
      }),
    ).toBe(false);
  });
});
