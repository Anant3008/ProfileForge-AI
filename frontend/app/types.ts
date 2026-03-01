/**
 * TypeScript types matching the backend API schemas
 */

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  date_of_birth?: string;
  city?: string;
  // Education details (optional during registration)
  tenth_board?: string;
  tenth_percentage?: number;
  twelfth_board?: string;
  twelfth_percentage?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  student_id: number;
}

// Education types
export interface EducationDetails {
  id: number;
  student_id: number;
  tenth_board: string | null;
  tenth_percentage: number | null;
  twelfth_board: string | null;
  twelfth_percentage: number | null;
}

export interface EducationUpdate {
  tenth_board?: string;
  tenth_percentage?: number;
  twelfth_board?: string;
  twelfth_percentage?: number;
}

// Student types
export interface Student {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  city: string | null;
  education: EducationDetails | null;
}

export interface StudentUpdate {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  city?: string;
}

// Course types
export interface Course {
  id: number;
  title: string;
  duration_months: number | null;
  fee: number | null;
}

// Application types
export interface Application {
  id: number;
  student_id: number;
  course_id: number;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  applied_at: string | null;
  reviewed_at: string | null;
  course: Course | null;
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  success: boolean;
}
