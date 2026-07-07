import { describe, expect, it } from "vitest";

import { isRemoteNewerThanLastSync } from "../conflictUtils";

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
