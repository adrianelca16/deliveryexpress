let returnTo: string | null = null;

export function setVerificacionReturnTo(route: string) {
  returnTo = route;
}

export function getVerificacionReturnTo() {
  const r = returnTo;
  returnTo = null;
  return r;
}
