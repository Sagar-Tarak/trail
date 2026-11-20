import {
  hashKey,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

/** Reset the destination synchronously before applying the submitted filters. */
export function restartSearch(
  client: QueryClient,
  currentKey: QueryKey,
  nextKey: QueryKey,
): Promise<void> {
  if (hashKey(currentKey) !== hashKey(nextKey)) {
    void client.cancelQueries({ queryKey: currentKey, exact: true });
  }
  return client.resetQueries({ queryKey: nextKey, exact: true });
}
