import type { QuizStep } from "@/types/content";

/**
 * Scent Finder steps. Each option's tags are matched against every product's moodTags, seasons,
 * occasions and theme mood ("warm" / "cold"), so new products join the quiz automatically.
 */
export const quiz: QuizStep[] = [
  {
    question: "When will you wear it?",
    options: [
      { label: "Office & daytime", tags: ["office", "daytime", "meetings"] },
      { label: "Evenings out", tags: ["evening", "night"] },
      { label: "Date night", tags: ["date night", "magnetic"] },
      { label: "Celebrations", tags: ["celebration", "luxurious"] },
    ],
  },
  {
    question: "Pick a vibe",
    weight: 1.5,
    options: [
      { label: "Velvet night", hint: "Deep, sweet, slow", tags: ["velvet", "night", "sweet-warm"] },
      { label: "Electric power", hint: "Sharp, bright, bold", tags: ["electric", "powerful", "confident"] },
      { label: "Fresh & clean", hint: "Crisp and easy", tags: ["fresh", "office"] },
      { label: "Rich & magnetic", hint: "Opulent, unforgettable", tags: ["magnetic", "luxurious"] },
    ],
  },
  {
    question: "Warm or cold?",
    options: [
      { label: "Warm & sweet", hint: "Amber, saffron, woods", tags: ["warm", "sweet-warm"] },
      { label: "Cold & crisp", hint: "Citrus, spice, leather", tags: ["cold", "fresh"] },
    ],
  },
  {
    question: "Your season",
    weight: 0.75,
    options: [
      { label: "Spring", tags: ["spring"] },
      { label: "Summer", tags: ["summer"] },
      { label: "Autumn", tags: ["autumn"] },
      { label: "Winter", tags: ["winter"] },
    ],
  },
];
