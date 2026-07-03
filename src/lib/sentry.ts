import * as Sentry from "@sentry/react-native";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

let hasInitializedSentry = false;

export function initSentry() {
  if (hasInitializedSentry) {
    return;
  }

  if (!sentryDsn) {
    console.log("Sentry DSN is missing. Sentry will not be initialized.");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__,
    enabled: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  });

  hasInitializedSentry = true;

  console.log("Sentry initialized");
}

export function captureAppError(error: unknown) {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error));

  Sentry.captureException(normalizedError);
}

export function sendTestSentryError() {
  captureAppError(
    new Error("Test Sentry error from Field Lead Tracker debug tools"),
  );

  console.log("Sent test error to Sentry");
}
