const CUSTOMER_LAUNCH_PATH_KEY = 'logdine.customerLaunchPath';

const customerMenuPathPattern = /^\/(?:m|order)\/[^/?#]+\/[^/?#]+\/?$/;

export function rememberCustomerLaunchPath(pathname: string) {
  if (!customerMenuPathPattern.test(pathname)) return;

  try {
    localStorage.setItem(CUSTOMER_LAUNCH_PATH_KEY, pathname);
  } catch {
    // Storage can be unavailable in restrictive/private browser modes.
  }
}

export function getCustomerLaunchPath() {
  try {
    const pathname = localStorage.getItem(CUSTOMER_LAUNCH_PATH_KEY);
    return pathname && customerMenuPathPattern.test(pathname) ? pathname : null;
  } catch {
    return null;
  }
}
