import { products } from "@/data/products";
import { feesOf, isStale, parseCatalogue, sizesOf, type Catalogue } from "@/lib/catalogue";

const sovereign = products.find((product) => product.slug === "sovereign")!;
const dominator = products.find((product) => product.slug === "dominator")!;

const catalogue: Catalogue = {
  currency: "PKR",
  deliveryFee: 180,
  codFee: 60,
  items: [
    { slug: "sovereign", name: "Sovereign", ml: 30, price: 1599, inStock: false },
    { slug: "sovereign", name: "Sovereign", ml: 50, price: 2299, inStock: true },
  ],
  fetchedAt: Date.now(),
};

describe("catalogue overlay", () => {
  it("uses the bundled values when nothing has loaded", () => {
    expect(sizesOf(sovereign, null)).toEqual(sovereign.sizes);
    expect(feesOf(null)).toEqual({ deliveryFee: 150, codFee: 50 });
  });

  it("replaces bundled prices and stock with live ones", () => {
    expect(sizesOf(sovereign, catalogue)).toEqual([
      { ml: 30, price: 1599, inStock: false },
      { ml: 50, price: 2299, inStock: true },
    ]);
    expect(feesOf(catalogue)).toEqual({ deliveryFee: 180, codFee: 60 });
  });

  it("treats a size missing from a loaded catalogue as sold out", () => {
    expect(sizesOf(dominator, catalogue)).toEqual([{ ml: 30, price: 1499, inStock: false }]);
  });

  it("parses the script's answer and rejects malformed ones", () => {
    const parsed = parseCatalogue({
      ok: true,
      currency: "PKR",
      deliveryFee: 150,
      codFee: 50,
      items: [
        { slug: "Sovereign", name: "Sovereign", ml: "30", price: 1399, inStock: true },
        { slug: "broken", ml: -1, price: 10, inStock: true },
      ],
    });
    expect(parsed?.items).toEqual([{ slug: "sovereign", name: "Sovereign", ml: 30, price: 1399, inStock: true }]);
    expect(parseCatalogue({ ok: true, items: [] })).toBeNull();
    expect(parseCatalogue("nope")).toBeNull();
  });

  it("knows when a catalogue is stale", () => {
    expect(isStale(null)).toBe(true);
    expect(isStale({ ...catalogue, fetchedAt: Date.now() - 6 * 60 * 1000 })).toBe(true);
    expect(isStale(catalogue)).toBe(false);
  });
});
