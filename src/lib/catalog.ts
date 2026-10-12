export const departments = [
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence & Machine Learning",
    short: "Intelligence",
    description:
      "Learning systems, intelligent decisions, and the foundations of artificial intelligence.",
    icon: "◎",
  },
  {
    slug: "computer-vision",
    name: "Computer Vision & Image Processing",
    short: "Vision",
    description:
      "Understanding visual information through computational methods and image analysis.",
    icon: "▧",
  },
  {
    slug: "medical-imaging",
    name: "Medical Imaging & Bioinformatics",
    short: "Health",
    description:
      "Exploring the intersection of computational science, medical images, and biological data.",
    icon: "✳",
  },
  {
    slug: "data-science",
    name: "Data Science & Analytics",
    short: "Data",
    description:
      "Discovering patterns and building understanding from complex datasets.",
    icon: "▥",
  },
  {
    slug: "robotics",
    name: "Robotics & Intelligent Systems",
    short: "Systems",
    description:
      "Connecting perception, reasoning, and action in intelligent computational systems.",
    icon: "⌘",
  },
  {
    slug: "green-computing",
    name: "Sustainable & Green Computing",
    short: "Sustainability",
    description:
      "Investigating resource-conscious computing and technology for a sustainable future.",
    icon: "❋",
  },
] as const;
export const membershipCategories = [
  "Fellow Members",
  "Senior Members",
  "Full Member",
  "Associate Member",
  "Training Members",
];
export const navigation = [
  ["Research", "/research"],
  ["Achievements", "/achievements"],
  ["People", "/members"],
  ["Recruitment", "/recruitment"],
  ["About", "/about"],
] as const;
