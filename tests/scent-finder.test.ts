import { products } from "@/data/products";
import { quiz } from "@/data/quiz";
import { rankProducts } from "@/lib/scent-finder";

const pick = (step: number, label: string) => quiz[step].options.findIndex((option) => option.label === label);

describe("Scent Finder ranking", () => {
  it("velvet / warm answers → Sovereign", () => {
    const answers = [pick(0, "Evenings out"), pick(1, "Velvet night"), pick(2, "Warm & sweet"), pick(3, "Winter")];
    const [best] = rankProducts(products, quiz, answers);
    expect(best.product.slug).toBe("sovereign");
    expect(best.match).toBeGreaterThan(50);
  });

  it("electric / cold answers → Dominator", () => {
    const answers = [pick(0, "Office & daytime"), pick(1, "Electric power"), pick(2, "Cold & crisp"), pick(3, "Summer")];
    expect(rankProducts(products, quiz, answers)[0].product.slug).toBe("dominator");
  });

  it("ranks every product", () => {
    expect(rankProducts(products, quiz, [0, 0, 0, 0])).toHaveLength(products.length);
  });
});
