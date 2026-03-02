import type {
  Application,
  ChatResponse,
  EducationDetails,
  EducationUpdate,
  LoginCredentials,
  RegisterCredentials,
  Student,
  StudentUpdate,
  TokenResponse,
  Course,
  AIActivityLog,
} from "../types";

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined. Add it to frontend/.env.local");
  }
  return apiBaseUrl;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function apiRequest<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const errorData = await response.json();
      message = errorData.detail ?? errorData.message ?? message;
    } catch {
      message = `${message} (${response.status})`;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  register: (payload: RegisterCredentials) =>
    apiRequest<TokenResponse>("/auth/register", "POST", payload),

  login: (payload: LoginCredentials) =>
    apiRequest<TokenResponse>("/auth/login", "POST", payload),
};

export const studentApi = {
  getProfile: (token: string) =>
    apiRequest<Student>("/student/profile", "GET", undefined, token),

  updateProfile: (payload: StudentUpdate, token: string) =>
    apiRequest<Student>("/student/profile", "PUT", payload, token),

  getEducation: (token: string) =>
    apiRequest<EducationDetails>("/student/education", "GET", undefined, token),

  createEducation: (payload: EducationUpdate, token: string) =>
    apiRequest<EducationDetails>("/student/education", "POST", payload, token),

  updateEducation: (payload: EducationUpdate, token: string) =>
    apiRequest<EducationDetails>("/student/education", "PUT", payload, token),

  getApplications: (token: string) =>
    apiRequest<Application[]>("/student/applications", "GET", undefined, token),

  applyForCourse: (courseId: number, token: string) =>
    apiRequest<Application>(`/student/apply?course_id=${courseId}`, "POST", undefined, token),

  getAiLogs: (token: string, limit = 50) =>
    apiRequest<AIActivityLog[]>(`/ai/logs?limit=${limit}`, "GET", undefined, token),
};

export const courseApi = {
  list: () => apiRequest<Course[]>("/courses", "GET"),
};

export const chatApi = {
  send: (message: string, token: string) =>
    apiRequest<ChatResponse>("/chat", "POST", { message }, token),
};
