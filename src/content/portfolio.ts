import data from './portfolio.json';

export interface CaseStudy {
  id: string;
  number: string;
  category: string;
  title: string;
  shortLabel?: string | null;
  date?: string | null;
  summary: string;
  contribution?: string | null;
  challenge?: string | null;
  details?: string[] | null;
  technologies?: string[] | null;
  system?: string[] | null;
  focus?: string | null;
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  date: string;
  bullets: string[];
  resumeDetails?: string[];
}

export const portfolio = data;
export const caseStudies: CaseStudy[] = data.caseStudies;
export const experience: Experience[] = data.experience;
