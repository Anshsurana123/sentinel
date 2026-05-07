let callsThisSession = 0;

export function incrementTavilyCount(n: number = 1) {
  callsThisSession += n;
}

export function getTavilyCallCount() {
  return callsThisSession;
}
