export function isRemoteNewerThanLastSync(
  remoteUpdatedAt: string | null | undefined,
  lastSyncedAt: string | null | undefined,
): boolean {
  if (!remoteUpdatedAt || !lastSyncedAt) {
    return false;
  }

  const remoteUpdatedAtMs = new Date(remoteUpdatedAt).getTime();
  const lastSyncedAtMs = new Date(lastSyncedAt).getTime();

  if (Number.isNaN(remoteUpdatedAtMs) || Number.isNaN(lastSyncedAtMs)) {
    return false;
  }

  return remoteUpdatedAtMs > lastSyncedAtMs;
}
