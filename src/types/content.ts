/** One choice in a scent-finder step. Tags are matched against product moodTags, seasons, occasions and mood. */
export type QuizOption = { label: string; hint?: string; tags: string[] };

export type QuizStep = { question: string; weight?: number; options: QuizOption[] };

export type Review = {
  name: string;
  /** City or country, optional. */
  location?: string;
  /** Product slug the review is about, optional. */
  product?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
};
