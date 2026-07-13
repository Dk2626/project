import {
  Mic2,
  Video,
  Award,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Webinars", href: "/webinars" },
  { label: "Jobs", href: "/jobs" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: Feature[] = [
  { icon: Mic2, title: "Expert Speakers", description: "Learn from industry experts" },
  { icon: Video, title: "Live Webinars", description: "Interactive & engaging" },
  { icon: Award, title: "Certifications", description: "Boost your career" },
  { icon: Briefcase, title: "Job Opportunities", description: "Find the perfect job" },
];

export interface Webinar {
  title: string;
  date: string;
  time: string;
  speaker: string;
  live?: boolean;
  // Dummy placeholder for now. Swap to a real image path in /public later.
  image?: string;
}

export const webinars: Webinar[] = [
  {
    title: "AI in Business Transformation",
    date: "May 24, 2024",
    time: "10:00 AM",
    speaker: "Dr. Sarah Johnson",
    live: true,
    image: "/placeholders/webinar.svg",
  },
  {
    title: "Marketing Strategies for 2024",
    date: "May 28, 2024",
    time: "11:00 AM",
    speaker: "Michael Smith",
    image: "/placeholders/webinar.svg",
  },
  {
    title: "Data Analytics with Python",
    date: "May 30, 2024",
    time: "02:00 PM",
    speaker: "David Brown",
    image: "/placeholders/webinar.svg",
  },
];

export interface Job {
  title: string;
  company: string;
  location: string;
  type: string;
  posted: string;
}

export const jobs: Job[] = [
  {
    title: "Frontend Developer",
    company: "TechNova Solutions",
    location: "Remote",
    type: "Full Time",
    posted: "2h ago",
  },
  {
    title: "Business Analyst",
    company: "InnovateX",
    location: "Bangalore",
    type: "Full Time",
    posted: "5h ago",
  },
  {
    title: "UI/UX Designer",
    company: "Pixel Perfect",
    location: "Hybrid",
    type: "Full Time",
    posted: "1d ago",
  },
];

export const footerColumns = [
  {
    heading: "Quick Links",
    links: ["Home", "About Us", "Services", "Webinars", "Jobs", "Blog", "Contact"],
  },
  {
    heading: "For Students",
    links: ["Dashboard", "Webinars", "Jobs", "Certificates", "Profile"],
  },
  {
    heading: "For Recruiters",
    links: ["Dashboard", "Post a Job", "Candidates", "Interviews"],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Privacy Policy", "Terms of Service"],
  },
];
