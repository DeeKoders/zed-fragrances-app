import { buildOrder, normalizePhone, orderMessage, orderTotals, validateCustomer } from "@/lib/checkout";
import type { Catalogue } from "@/lib/catalogue";

describe("checkout totals", () => {
  const order = buildOrder([{ slug: "sovereign", ml: 30, quantity: 1 }]);

  it("wallet = items + 150", () => {
    expect(orderTotals(order, "wallet").total).toBe(1399 + 150);
  });

  it("COD = items + 200", () => {
    const totals = orderTotals(order, "cod");
    expect(totals.total).toBe(1399 + 200);
    expect(totals.codFee).toBe(50);
  });

  it("adds every line", () => {
    const two = buildOrder([
      { slug: "sovereign", ml: 30, quantity: 2 },
      { slug: "dominator", ml: 30, quantity: 1 },
    ]);
    expect(two.total).toBe(1399 * 2 + 1499);
  });

  it("drops unknown products and sizes", () => {
    expect(buildOrder([{ slug: "nope", ml: 30, quantity: 1 }, { slug: "sovereign", ml: 999, quantity: 1 }]).lines).toHaveLength(0);
  });

  it("uses the live fees when a catalogue has loaded", () => {
    const catalogue: Catalogue = {
      currency: "PKR",
      deliveryFee: 200,
      codFee: 75,
      items: [{ slug: "sovereign", name: "Sovereign", ml: 30, price: 1500, inStock: true }],
      fetchedAt: Date.now(),
    };
    const live = buildOrder([{ slug: "sovereign", ml: 30, quantity: 1 }], catalogue);
    expect(orderTotals(live, "cod", catalogue).total).toBe(1500 + 200 + 75);
  });

  it("writes the WhatsApp fallback with every detail", () => {
    const message = orderMessage(order, "cod", {
      name: "Ayesha",
      phone: "0300-1234567",
      city: "Lahore",
      address: "House 1",
      notes: "",
    });
    expect(message).toContain("• Sovereign 30ml × 1");
    expect(message).toContain("COD charges");
    expect(message).toContain("Lahore");
  });
});

describe("normalizePhone", () => {
  it.each(["0300 1234567", "+92 300 1234567", "0092-300-1234567", "3001234567"])("accepts %s", (phone) => {
    expect(normalizePhone(phone)).toBe("0300-1234567");
  });

  it.each(["042 35761234", "021-1234567", "0300 12345", "12345", ""])("rejects %s", (phone) => {
    expect(normalizePhone(phone)).toBeNull();
  });
});

describe("validateCustomer", () => {
  it("flags missing and invalid fields", () => {
    const errors = validateCustomer({ name: "", phone: "123", city: "", address: "", notes: "" });
    expect(Object.keys(errors)).toEqual(["name", "phone", "city", "address"]);
  });

  it("enforces the limits", () => {
    const errors = validateCustomer({ name: "a".repeat(81), phone: "0300 1234567", city: "Lahore", address: "x", notes: "n".repeat(501) });
    expect(Object.keys(errors)).toEqual(["name", "notes"]);
  });
});
