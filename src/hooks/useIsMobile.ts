export function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

