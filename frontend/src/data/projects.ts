export type Project = {
  id: string;
  index: string;
  title: string;
  year: string;
  category: string;
  slug: string;
  asset: string;
};

export const projects: Project[] = [
  {
    id: "1",
    index: "01",
    title: "Project One",
    year: "2023",
    category: "Web Design",
    slug: "project-one",
    asset: "/assets/placeholder-1.jpg"
  },
  {
    id: "2",
    index: "02",
    title: "Project Two",
    year: "2024",
    category: "Development",
    slug: "project-two",
    asset: "/assets/placeholder-2.jpg"
  },
  {
    id: "3",
    index: "03",
    title: "Project Three",
    year: "2025",
    category: "UX/UI",
    slug: "project-three",
    asset: "/assets/placeholder-3.jpg"
  },
  {
    id: "4",
    index: "04",
    title: "Project Four",
    year: "2026",
    category: "Creative Direction",
    slug: "project-four",
    asset: "/assets/placeholder-4.jpg"
  }
];
