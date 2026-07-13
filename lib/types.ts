export type Role = "student" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface JobItem {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience?: string;
  salary?: string;
  description?: string;
  skills?: string[];
  active?: boolean;
  createdAt?: string;
}

export interface WebinarItem {
  _id: string;
  title: string;
  speaker: string;
  date: string;
  time: string;
  description?: string;
  live?: boolean;
  active?: boolean;
  createdAt?: string;
}

export interface ApplicationItem {
  _id: string;
  kind: "job" | "webinar";
  status: string;
  note?: string;
  resumeUrl?: string;
  createdAt?: string;
  job?: JobItem | null;
  webinar?: WebinarItem | null;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    college?: string;
    degree?: string;
    resumeUrl?: string;
  } | null;
}
