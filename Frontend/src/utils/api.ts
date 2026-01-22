const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : 'http://127.0.0.1:8000';
interface ApiError {
  message: string;
  status: number;
}
type AccessTokenResponse = {
  access_token: string;
  token_type: string;
};

export interface SavedScholar {
  scholarId: string;
  name: string;
  title: string;
  institution: string;
  department: string;
  researchInterests: string[];
  hIndex: number;
  citationCount: number;
  publicationCount: number;
  email: string;
  image?: string | null;
  note?: string;
  savedAt?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
  getToken(): string | null {
    return this.token;
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const config: RequestInit = {
      ...options,
      headers,
    };
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      if (!response.ok) {
        let errorMessage = await response.text();
        try {
          const errorJson = JSON.parse(errorMessage);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
        }
        const error: ApiError = {
          message: errorMessage,
          status: response.status,
        };
        throw error;
      }
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('BACKEND_NOT_CONNECTED');
      }
      console.error('API request failed:', error);
      throw error;
    }
  }
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return this.request<AccessTokenResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  }

  async getGoogleOAuthUrl(): Promise<string> {
    try {
      const endpoint = `${this.baseUrl}/auth/oauth/google`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { detail: errorText || 'Failed to get Google OAuth URL' };
        }
        throw new Error(error.detail || error.message || 'Failed to get Google OAuth URL');
      }
      
      const data = await response.json();
      const oauthUrl = data.auth_url || data.authUrl || data.url;
      
      if (!oauthUrl || typeof oauthUrl !== 'string') {
        throw new Error('Invalid OAuth URL format received from server');
      }
      
      return oauthUrl;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('BACKEND_NOT_CONNECTED');
      }
      throw error;
    }
  }

  async getGithubOAuthUrl(): Promise<string> {
    try {
      const endpoint = `${this.baseUrl}/auth/oauth/github`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { detail: errorText || 'Failed to get GitHub OAuth URL' };
        }
        throw new Error(error.detail || error.message || 'Failed to get GitHub OAuth URL');
      }
      
      const data = await response.json();
      const oauthUrl = data.auth_url || data.authUrl || data.url;
      
      if (!oauthUrl || typeof oauthUrl !== 'string') {
        throw new Error('Invalid OAuth URL format received from server');
      }
      
      return oauthUrl;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('BACKEND_NOT_CONNECTED');
      }
      throw error;
    }
  }

  async handleOAuthCallback(provider: 'google' | 'github', code: string): Promise<AccessTokenResponse> {
    try {
      const endpoint = `${this.baseUrl}/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { detail: errorText || `Failed to complete ${provider} OAuth login` };
        }
        throw new Error(error.detail || error.message || `Failed to complete ${provider} OAuth login`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('BACKEND_NOT_CONNECTED');
      }
      throw error;
    }
  }
  async requestPasswordReset(email: string) {
    const response = await fetch(`${this.baseUrl}/auth/password-reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to request password reset' }));
      throw new Error(error.detail || 'Failed to request password reset');
    }
    
    return await response.json();
  }

  async verifyPasswordResetCode(email: string, code: string) {
    const response = await fetch(`${this.baseUrl}/auth/password-reset/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Invalid or expired code' }));
      throw new Error(error.detail || 'Invalid or expired code');
    }
    
    return await response.json();
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const response = await fetch(`${this.baseUrl}/auth/password-reset/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to reset password' }));
      throw new Error(error.detail || 'Failed to reset password');
    }
    
    return await response.json();
  }

  async signup(name: string, email: string, password: string) {
    await this.request('/api/v1/user/', {
      method: 'POST',
      body: JSON.stringify({
        full_name: name,
        email,
        password,
      }),
    });
    const auth = await this.login(email, password);
    return auth;
  }
  async logout() {
    this.setToken(null);
  }
  async getCurrentUser() {
    return this.request<any>('/api/v1/user/me');
  }
  async getScholars(params: {
    search?: string;
    field?: string;
    interests?: string;
    institution?: string;
    department?: string;
    university_id?: string;
    department_id?: string;
    title?: string;
    minHIndex?: number;
    maxHIndex?: number;
    minCitations?: number;
    availability?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    const response = await this.request<any>(
      `/api/v1/scholars/?${queryString}`
    );
    return {
      scholars: response.scholars.map((s: any) => ({
        id: s.scholar_id,
        name: s.full_name || 'Unknown Scholar',
        title: s.title || '',
        institution: s.institution || '',
        department: s.department || '',
        researchInterests: s.research_areas || [],
        hIndex: s.h_index || 0,
        citationCount: s.citation_count || 0,
        publicationCount: s.publication_count || 0,
        availability: s.availability || 'Available',
        email: s.email || '',
        image: s.image || null,
      })),
      total: response.total,
      page: response.page,
      totalPages: response.total_pages
    };
  }
  async getScholar(id: string) {
    const s = await this.request<any>(`/api/v1/scholars/${id}`);
    const parseYear = (str: any) => {
      if (!str) return 0;
      const match = String(str).match(/\d{4}/);
      return match ? parseInt(match[0]) : 0;
    };
    const sortByDate = (a: any, b: any, field: string) =>
      parseYear(b[field]) - parseYear(a[field]);
    return {
      id: s.scholar_id,
      name: s.full_name || 'Unknown Scholar',
      title: s.title || '',
      institution: s.institution || '',
      department: s.department || '',
      researchInterests: s.research_areas || [],
      hIndex: s.h_index || 0,
      citationCount: s.citation_count || 0,
      publicationCount: s.publication_count || (s.publications ? s.publications.length : 0),
      availability: s.availability || 'Available',
      email: s.email || '',
      bio: s.bio || '',
      image: s.image || null,
      orcid: s.orcid || '',
      profileUrl: s.profile_url || '',
      education: (s.education || []).sort((a: any, b: any) => sortByDate(a, b, 'year_range')),
      academicHistory: (s.academic_history || []).sort((a: any, b: any) => sortByDate(a, b, 'year')),
      courses: (s.courses || []).sort((a: any, b: any) => sortByDate(a, b, 'academic_year')),
      thesisSupervisions: (s.thesis_supervisions || []).sort((a: any, b: any) => sortByDate(a, b, 'year')),
      administrativeDuties: (s.administrative_duties || []).sort((a: any, b: any) => sortByDate(a, b, 'year_range')),
      publications: (s.publications || []).sort((a: any, b: any) => sortByDate(a, b, 'year')),
    };
  }
  async getScholarTitles() {
    return this.request<string[]>('/api/v1/scholars/titles');
  }

  async getScholarPublications(id: string) {
    return this.request<any[]>(`/api/v1/scholars/${id}/publications`);
  }
  async getScholarCollaborations(id: string) {
    return this.request<any>(`/api/v1/scholars/${id}/collaborations`);
  }
  async getUniversities() {
    return this.request<any[]>('/api/v1/universities/');
  }
  async getMostPublicationsUniversities(limit: number = 6) {
    return this.request<any[]>(`/api/v1/universities/most-publications?limit=${limit}`);
  }
  async getUniversityDepartments(universityId: string) {
    return this.request<any[]>(`/api/v1/universities/${universityId}/departments`);
  }
  async submitContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.request('/api/v1/contact/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  async getSavedSearches(params?: { skip?: number; limit?: number }) {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    const url = queryString 
      ? `/api/v1/user/saved-searches?${queryString}`
      : '/api/v1/user/saved-searches';
    return this.request<any[]>(url);
  }
  async saveScholar(scholarId: string, note?: string) {
    return this.request('/api/v1/user/me/saved-scholars', {
      method: 'POST',
      body: JSON.stringify({ scholar_id: scholarId, note }),
    });
  }
  async getSavedScholars(): Promise<SavedScholar[]> {
    const response = await this.request<any[]>('/api/v1/user/me/saved-scholars');
    return response.map((s) => ({
      scholarId: s.scholar_id,
      name: s.full_name || s.scholar?.full_name || 'Unknown Scholar',
      title: s.title || s.scholar?.title || '',
      institution: s.institution || s.scholar?.institution || '',
      department: s.department || s.scholar?.department || '',
      researchInterests: s.research_areas || s.scholar?.research_areas || [],
      hIndex: s.h_index || s.scholar?.h_index || 0,
      citationCount: s.citation_count || s.scholar?.citation_count || 0,
      publicationCount: s.publication_count || s.scholar?.publication_count || 0,
      email: s.email || s.scholar?.email || '',
      image: s.image || s.scholar?.image || null,
      note: s.note,
      savedAt: s.created_at || s.saved_at
    }));
  }
  async deleteSavedScholar(scholarId: string) {
    return this.request(`/api/v1/user/me/saved-scholars/${scholarId}`, {
      method: 'DELETE',
    });
  }
  async checkSavedScholar(scholarId: string) {
    return this.request<{ is_saved: boolean }>(`/api/v1/user/me/saved-scholars/${scholarId}/check`);
  }
  async createSavedSearch(search: any) {
    return this.request<any>('/api/v1/user/saved-searches', {
      method: 'POST',
      body: JSON.stringify(search),
    });
  }
  async deleteSavedSearch(id: string) {
    return this.request(`/api/v1/user/saved-searches/${id}`, {
      method: 'DELETE',
    });
  }
  async updateSavedSearch(id: string, data: {
    name?: string;
    query_params?: any;
    result_snapshot?: number;
    emailNotifications?: boolean;
  }) {
    return this.request(`/api/v1/user/saved-searches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  async updateSavedSearchNotifications(id: string, emailNotifications: boolean) {
    return this.updateSavedSearch(id, { emailNotifications });
  }
  async updateProfile(data: any) {
    return this.request<any>('/api/v1/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  async getRecommendations(researchInterests?: string) {
    const query = researchInterests ? `?interests=${encodeURIComponent(researchInterests)}` : '';
    return this.request<any[]>(`/api/v1/recommendations/${query}`);
  }
  async getAllResearchInterests(search?: string, top?: number) {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    if (top) {
      params.append('top', top.toString());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<string[]>(`/api/v1/scholars/research-interests${query}`);
  }
  async getUserInterests() {
    return this.request<string[] | { interests: string[] }>('/api/v1/user/me/interests');
  }
  async addUserInterest(interest: string) {
    return this.request('/api/v1/user/me/interests', {
      method: 'POST',
      body: JSON.stringify({ interest }),
    });
  }
  async deleteUserInterest(interest: string) {
    return this.request(`/api/v1/user/me/interests?interest=${encodeURIComponent(interest)}`, {
      method: 'DELETE',
    });
  }
  async updateUserInterests(interests: string[]) {
    return this.request('/api/v1/user/interests', {
      method: 'PUT',
      body: JSON.stringify(interests),
    });
  }
  async submitEdit(scholarId: string, changes: any, reason?: string) {
    const body: any = { 
      scholarId, 
      changes 
    };
    if (reason) {
      body.reason = reason;
    }
    return this.request('/api/v1/edits/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  async getMyEditRequests(params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    skip?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    const url = queryString 
      ? `/api/v1/edits/me?${queryString}`
      : '/api/v1/edits/me';
    return this.request<any[]>(url);
  }
  async getEditRequest(requestId: string) {
    return this.request<any>(`/api/v1/edits/${requestId}`);
  }
  async getAllEditRequests(params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    skip?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    const url = queryString 
      ? `/api/v1/admin/edits?${queryString}`
      : '/api/v1/admin/edits';
    return this.request<any[]>(url);
  }
  async getPendingEdits(params?: {
    skip?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    const url = queryString 
      ? `/api/v1/admin/edits/pending?${queryString}`
      : '/api/v1/admin/edits/pending';
    return this.request<any[]>(url);
  }
  async approveEdit(id: string) {
    return this.request(`/api/v1/admin/edits/${id}/approve`, {
      method: 'PUT',
    });
  }
  async rejectEdit(id: string, reason: string) {
    return this.request(`/api/v1/admin/edits/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }
  async getDuplicateScholars() {
    return this.request<any[]>('/api/v1/admin/duplicates');
  }
  async mergeScholars(primaryId: string, duplicateIds: string[]) {
    return this.request('/api/v1/admin/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryId, duplicateIds }),
    });
  }
  async getUsers() {
    return this.request<any[]>('/api/v1/user/');
  }
  async updateUser(userId: string, data: any) {
    return this.request(`/api/v1/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  async deleteUser(userId: string) {
    return this.request(`/api/v1/user/${userId}`, {
      method: 'DELETE',
    });
  }
  async updateUserRole(userId: string, role: string) {
    return this.request(`/api/v1/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }
  async getActivityLogs() {
    return this.request<any[]>('/api/v1/admin/logs');
  }
  async getSystemLogs(params?: {
    page?: number;
    limit?: number;
    user_id?: string;
    action_type?: string;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    const url = queryString 
      ? `/api/v1/admin/system-logs?${queryString}`
      : '/api/v1/admin/system-logs';
    return this.request<{
      logs: any[];
      total: number;
      page: number;
      total_pages: number;
      limit: number;
    }>(url);
  }
  async triggerScrapeAllUniversities() {
    return this.request('/scraper/universities/all', { method: 'POST' });
  }
  async triggerScrapeAllDepartments() {
    return this.request('/scraper/departments/all', { method: 'POST' });
  }
  async triggerScrapeAllScholars() {
    return this.request('/scraper/scholar/all', { method: 'POST' });
  }
}
export const api = new ApiClient(API_BASE_URL);