import { useNetInfo } from "@react-native-community/netinfo";

export type NetworkStatus = "online" | "offline" | "unknown";

export function useNetworkStatus() {
  const netInfo = useNetInfo();

  const isCheckingNetwork =
    netInfo.isConnected === null && netInfo.isInternetReachable === null;

  const isClearlyOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  const status: NetworkStatus = isCheckingNetwork
    ? "unknown"
    : isClearlyOffline
      ? "offline"
      : "online";

  return {
    status,
    isCheckingNetwork,
    isOnline: status === "online",
    isOffline: status === "offline",
    isClearlyOffline,
  };
}
