import { brand } from "@/config/brand";

/** wa.me link to the brand number, optionally with a prefilled message. */
export function whatsappUrl(message?: string) {
  const url = `https://wa.me/${brand.whatsapp}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
