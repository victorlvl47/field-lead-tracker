export async function initDatabase() {
  console.log("SQLite skipped on web");
}

export async function getDatabase(): Promise<never> {
  throw new Error("SQLite database is not available on web in this app.");
}