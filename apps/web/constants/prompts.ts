export interface PromptItem {
  category: string;
  seed: string;
  label: string;
  description: string;
}

export const EXAMPLE_PROMPTS: PromptItem[] = [
  {
    category: "Motivational Quote",
    seed: "The only limit to our realization of tomorrow",
    label: "Tomorrow's Limits",
    description: "Inspirational continuation regarding future obstacles."
  },
  {
    category: "Life Advice",
    seed: "In the end it is not the years in your life",
    label: "A Life Measured",
    description: "Philosophical continuation on what truly matters."
  },
  {
    category: "Leadership",
    seed: "A genuine leader is not a searcher for consensus",
    label: "True Leadership",
    description: "Insights on taking charge and staying independent."
  },
  {
    category: "Business",
    seed: "The secret of change is to focus all of your energy",
    label: "Focusing Energy",
    description: "Entrepreneurial guidance on driving change."
  },
  {
    category: "Creativity",
    seed: "Logic will get you from A to B",
    label: "Logic vs Imagination",
    description: "Creative thought prompt on boundaries of logic."
  },
  {
    category: "Technology",
    seed: "The future belongs to those who learn more skills",
    label: "Future Skills",
    description: "Modern career advice on adaptation."
  },
  {
    category: "Friendship",
    seed: "A real friend is one who walks in when",
    label: "Walking In",
    description: "Warm thoughts on true friendship and loyalty."
  },
  {
    category: "Love",
    seed: "The best thing to hold onto in life is",
    label: "Holding Onto Love",
    description: "Romantic quote continuation."
  },
  {
    category: "Education",
    seed: "The beautiful thing about learning is that no one",
    label: "Unstoppable Learning",
    description: "Reflections on continuous education."
  },
  {
    category: "Success",
    seed: "Success is not final failure is not fatal",
    label: "Final Success",
    description: "Classic quote continuation on resilience."
  }
];
