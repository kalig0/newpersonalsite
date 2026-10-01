import data from './portfolio.json';

export interface CaseStudy {
  id: string;
  number: string;
  category: string;
  title: string;
  date?: string;
  summary: string;
  contribution: string;
  challenge: string;
  details: string[];
  technologies: string[];
  system: string[];
  focus: string;
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
