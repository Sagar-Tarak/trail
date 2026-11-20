interface ReturnLocation {
  pathname?: string;
  search?: string;
  hash?: string;
}

/** Keep the investigation context when a protected page requires sign-in. */
export function signInReturnPath(location?: ReturnLocation): string {
  const pathname = location?.pathname;
  if (!pathname || !pathname.startsWith("/") || /^\/[/\\]/.test(pathname)) {
    return "/";
  }
  return `${pathname}${location.search ?? ""}${location.hash ?? ""}`;
}
