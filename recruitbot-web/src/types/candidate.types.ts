export interface Experience {
  company: string;
  title: string;
  duration?: string;
  description?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
}

/**
 * Full candidate profile for the modal (Phase 14).
 *
 * NOTE: the backend does not currently expose GET /candidate/:id. This
 * shape is the target; Phase 14 reconciles how the modal is populated
 * (adapt from search results and/or a new backend route).
 */
export interface CandidateProfile {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  title?: string;
  company?: string;
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
  projects?: { title: string; description: string }[];
  certifications?: string[];
  text?: string;
  processedAt?: string;
}
