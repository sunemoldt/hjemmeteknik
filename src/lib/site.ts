export const SITE_URL = "https://hjemmeteknik.dk";
export const SITE_NAME = "hjemmeteknik.dk";
export const SITE_DESCRIPTION =
  "Redaktionelle guides, anmeldelser og fejlfinding om hjemmeteknik — smart home, netværk, robotstøvsugere og alt det, der gør et hjem lidt smartere.";
export const SITE_LOCALE = "da_DK";

export function absUrl(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return SITE_URL + path;
}
