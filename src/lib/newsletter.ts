/**
 * Newsletter sign-up. Placeholder: resolves after a short delay. Plug a provider in here
 * (Mailchimp, Klaviyo, a route handler, …); the footer form only depends on this signature.
 */
export async function subscribe(email: string): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  await new Promise((resolve) => setTimeout(resolve, 600));
}
