// API Configuration
// Set to false to use ONLY real backend (no localStorage fallback)
const ENABLE_FALLBACK = false;

// Use localhost for development
export const API_BASE_URL = 'http://localhost:3000';

// Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface AuthResponse {
    user: UserProfile;
    token: string;
}

export interface UserProfile {
    id: string;
    name: string;
    age: number;
    bio: string;
    photos: UserPhoto[];
    interests: string[];
    vibeBadges: string[];
    location?: {
        city?: string;
    };
}

export interface UserPhoto {
    id: string;
    url: string;
    order: number;
    uploadedAt: string;
}

export interface DiscoveryCard {
    user: UserProfile;
    commonInterests: string[];
    matchScore: number;
}

export interface Match {
    id: string;
    user1Id: string;
    user2Id: string;
    matchedAt: string;
    conversationId: string;
    isActive: boolean;
}

export interface Message {
    id?: string;
    _id?: string;
    conversationId?: string;
    conversation?: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface Conversation {
    id: string;
    user1Id: string;
    user2Id: string;
    matchId: string;
    lastMessageAt?: string;
    unreadCount: { [userId: string]: number };
    createdAt: string;
}

// Token Management
export const TokenManager = {
    getToken: (): string | null => {
        return localStorage.getItem('tremble_token');
    },

    setToken: (token: string): void => {
        localStorage.setItem('tremble_token', token);
    },

    removeToken: (): void => {
        localStorage.removeItem('tremble_token');
    },

    getAuthHeaders: (): HeadersInit => {
        const token = TokenManager.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
    },
};

// API Client
class TrembleAPI {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const isFormData = options.body instanceof FormData;
            
            const getHeaders = () => {
                const authHeaders = TokenManager.getAuthHeaders();
                if (isFormData) {
                    const { 'Content-Type': _, ...rest } = authHeaders;
                    return rest;
                }
                return authHeaders;
            };
                
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...getHeaders(),
                    ...options.headers,
                },
            });

            const data = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `HTTP error ${response.status}`,
                };
            }
            
            return data;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Network error',
            };
        }
    }

    // Authentication
    auth = {
        register: async (data: {
            email: string;
            username: string;
            password: string;
            name: string;
            age: number;
        }): Promise<ApiResponse<AuthResponse>> => {
            // Try real API first
            try {
                const response = await this.request<AuthResponse>('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });

                if (response.success && response.data?.token) {
                    TokenManager.setToken(response.data.token);
                    return response;
                }

                // API returned error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return response;
                }
            } catch (error) {
                // Network error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return {
                        success: false,
                        error: 'Network error',
                    };
                }
            }

            // Fallback to localStorage
            const mockUser: UserProfile = {
                id: 'mock_' + Date.now(),
                name: data.name,
                age: data.age,
                bio: '',
                photos: [],
                interests: [],
                vibeBadges: [],
            };
            const mockToken = 'mock_token_' + Date.now();

            localStorage.setItem('mock_user', JSON.stringify(mockUser));
            localStorage.setItem('mock_credentials', JSON.stringify({ email: data.email, password: data.password }));
            TokenManager.setToken(mockToken);

            return {
                success: true,
                data: {
                    user: mockUser,
                    token: mockToken,
                },
            };
        },

        login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
            // Try real API first
            try {
                const response = await this.request<AuthResponse>('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                });

                if (response.success && response.data?.token) {
                    TokenManager.setToken(response.data.token);
                    return response;
                }

                // API returned error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return response;
                }
            } catch (error) {
                // Network error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return {
                        success: false,
                        error: 'Network error',
                    };
                }
            }

            // Fallback to localStorage
            const storedCreds = localStorage.getItem('mock_credentials');
            const storedUser = localStorage.getItem('mock_user');

            if (storedCreds && storedUser) {
                const creds = JSON.parse(storedCreds);
                if (creds.email === email && creds.password === password) {
                    const user: UserProfile = JSON.parse(storedUser);
                    const mockToken = 'mock_token_' + Date.now();
                    TokenManager.setToken(mockToken);

                    return {
                        success: true,
                        data: {
                            user,
                            token: mockToken,
                        },
                    };
                }
            }

            return {
                success: false,
                error: 'Invalid credentials',
            };
        },

        logout: async (): Promise<ApiResponse> => {
            TokenManager.removeToken();
            return { success: true };
        },

        getCurrentUser: async (): Promise<ApiResponse<UserProfile>> => {
            // Try real API first
            try {
                const response = await this.request<UserProfile>('/api/auth/me');
                if (response.success) {
                    return response;
                }

                // API returned error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return response;
                }
            } catch (error) {
                // Network error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return {
                        success: false,
                        error: 'Network error',
                    };
                }
            }

            // Fallback to localStorage
            const storedUser = localStorage.getItem('mock_user');
            if (storedUser) {
                return {
                    success: true,
                    data: JSON.parse(storedUser),
                };
            }
            return {
                success: false,
                error: 'No user found',
            };
        },
    };

    // Users
    users = {
        getProfile: async (userId: string): Promise<ApiResponse<UserProfile>> => {
            return this.request<UserProfile>(`/api/users/${userId}`);
        },

        updateProfile: async (data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
            // Try real API first
            try {
                const response = await this.request<UserProfile>('/api/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });

                if (response.success) {
                    return response;
                }

                // API returned error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return response;
                }
            } catch (error) {
                // Network error, fallback if enabled
                if (!ENABLE_FALLBACK) {
                    return {
                        success: false,
                        error: 'Network error',
                    };
                }
            }

            // Fallback to localStorage
            const storedUser = localStorage.getItem('mock_user');
            if (storedUser) {
                const user: UserProfile = JSON.parse(storedUser);
                const updatedUser = { ...user, ...data };
                localStorage.setItem('mock_user', JSON.stringify(updatedUser));
                return {
                    success: true,
                    data: updatedUser,
                };
            }
            return {
                success: false,
                error: 'No user found',
            };
        },

        uploadPhoto: async (photo: File): Promise<ApiResponse<{ url: string }>> => {
            const formData = new FormData();
            formData.append('photo', photo);
            return this.request<{ url: string }>('/api/users/upload-photo', {
                method: 'POST',
                body: formData,
            });
        },

        deletePhoto: async (photoId: string): Promise<ApiResponse<UserProfile>> => {
            return this.request<UserProfile>(`/api/users/photos/${photoId}`, {
                method: 'DELETE',
            });
        },

        updateSettings: async (settings: any): Promise<ApiResponse<UserProfile>> => {
            return this.request<UserProfile>('/api/users/settings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });
        },

        getStats: async (): Promise<ApiResponse<any>> => {
            return this.request('/api/users/stats');
        },
    };

    // Discovery
    discovery = {
        getFeed: async (page: number = 1, limit: number = 10): Promise<ApiResponse<{
            data: DiscoveryCard[];
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        }>> => {
            return this.request(`/api/discovery/feed?page=${page}&limit=${limit}`);
        },

        refresh: async (): Promise<ApiResponse> => {
            return this.request('/api/discovery/refresh', {
                method: 'POST',
            });
        },

        updatePreferences: async (preferences: any): Promise<ApiResponse> => {
            return this.request('/api/discovery/preferences', {
                method: 'PUT',
                body: JSON.stringify(preferences),
            });
        },
    };

    // Connections
    connections = {
        like: async (targetUserId: string): Promise<ApiResponse<{ matched: boolean; match?: Match }>> => {
            return this.request('/api/connections/like', {
                method: 'POST',
                body: JSON.stringify({ targetUserId }),
            });
        },

        pass: async (targetUserId: string): Promise<ApiResponse> => {
            return this.request('/api/connections/pass', {
                method: 'POST',
                body: JSON.stringify({ targetUserId }),
            });
        },

        tremble: async (targetUserId: string): Promise<ApiResponse<{ matched: boolean; match?: Match }>> => {
            return this.request('/api/connections/tremble', {
                method: 'POST',
                body: JSON.stringify({ targetUserId }),
            });
        },

        getMatches: async (): Promise<ApiResponse<Array<{ match: Match; user: UserProfile }>>> => {
            return this.request('/api/connections/matches');
        },

        unmatch: async (matchId: string): Promise<ApiResponse> => {
            return this.request(`/api/connections/${matchId}`, {
                method: 'DELETE',
            });
        },
    };

    // Matches (Tinder-style matching)
    matches = {
        like: async (userId: string): Promise<ApiResponse<{ matched: boolean; match?: any }>> => {
            return this.request(`/api/matches/like/${userId}`, {
                method: 'POST',
            });
        },

        pass: async (userId: string): Promise<ApiResponse> => {
            return this.request(`/api/matches/pass/${userId}`, {
                method: 'POST',
            });
        },

        unlike: async (userId: string): Promise<ApiResponse> => {
            return this.request(`/api/matches/unlike/${userId}`, {
                method: 'DELETE',
            });
        },

        getMatches: async (): Promise<ApiResponse<Array<{ matchId: string; user: UserProfile; matchedAt: string }>>> => {
            return this.request('/api/matches/matches');
        },
    };

    // Messages
    messages = {
        getConversations: async (): Promise<ApiResponse<Array<{
            conversation: Conversation;
            otherUser: UserProfile;
            lastMessage?: Message;
        }>>> => {
            return this.request('/api/messages/conversations');
        },

        getMessages: async (otherUserId: string): Promise<ApiResponse<Message[]>> => {
            return this.request(`/api/messages/${otherUserId}`);
        },

        send: async (receiverId: string, content: string): Promise<ApiResponse<Message>> => {
            return this.request('/api/messages/send', {
                method: 'POST',
                body: JSON.stringify({ receiverId, content }),
            });
        },

        markAsRead: async (messageId: string): Promise<ApiResponse> => {
            return this.request(`/api/messages/${messageId}/read`, {
                method: 'PUT',
            });
        },

        getIcebreakers: async (): Promise<ApiResponse<any[]>> => {
            return this.request('/api/messages/icebreakers');
        },
    };

    // Posts
    posts = {
        create: async (photoUrl: string, caption: string): Promise<ApiResponse<any>> => {
            return this.request('/api/posts', {
                method: 'POST',
                body: JSON.stringify({ photoUrl, caption }),
            });
        },

        getFeed: async (): Promise<ApiResponse<Array<{ post: any; user: UserProfile }>>> => {
            return this.request('/api/posts/feed');
        },

        getPost: async (postId: string): Promise<ApiResponse<any>> => {
            return this.request(`/api/posts/${postId}`);
        },

        getUserPosts: async (userId: string): Promise<ApiResponse<any[]>> => {
            return this.request(`/api/posts/user/${userId}`);
        },

        delete: async (postId: string): Promise<ApiResponse> => {
            return this.request(`/api/posts/${postId}`, {
                method: 'DELETE',
            });
        },
    };

    // Safety
    safety = {
        report: async (data: {
            reportedUserId?: string;
            reportedPostId?: string;
            reason: string;
            description?: string;
        }): Promise<ApiResponse> => {
            return this.request('/api/safety/report', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        block: async (blockedUserId: string): Promise<ApiResponse> => {
            return this.request('/api/safety/block', {
                method: 'POST',
                body: JSON.stringify({ blockedUserId }),
            });
        },

        unblock: async (blockedUserId: string): Promise<ApiResponse> => {
            return this.request(`/api/safety/block/${blockedUserId}`, {
                method: 'DELETE',
            });
        },

        getBlocked: async (): Promise<ApiResponse<any[]>> => {
            return this.request('/api/safety/blocked');
        },
    };

    // Glimpses
    glimpses = {
        getFeed: async (limit = 20): Promise<ApiResponse<any[]>> => {
            return this.request(`/api/glimpses/feed?limit=${limit}`);
        },

        create: async (formData: FormData): Promise<ApiResponse<any>> => {
            // For file upload, we need special handling if request() enforces JSON
            // But if request() wrapper is simple, we can pass body as FormData
            // We might need to ensure Content-Type is NOT set to application/json

            return this.request('/api/glimpses', {
                method: 'POST',
                body: formData,
                // If this.request sets Content-Type automatically, we might have an issue.
                // Assuming this.request checks if body is FormData or uses standard fetch headers.
            });
        },

        like: async (id: string): Promise<ApiResponse> => {
            return this.request(`/api/glimpses/${id}/like`, { method: 'POST' });
        },

        tremble: async (id: string): Promise<ApiResponse> => {
            return this.request(`/api/glimpses/${id}/tremble`, { method: 'POST' });
        },

        recordView: async (id: string, duration: number): Promise<ApiResponse> => {
            return this.request(`/api/glimpses/${id}/view`, {
                method: 'POST',
                body: JSON.stringify({ duration }),
            });
        },
    };

    // Vibes
    vibes = {
        getUserVibes: async (userId: string): Promise<ApiResponse<any[]>> => {
            return this.request(`/api/vibes/${userId}`);
        },

        generate: async (): Promise<ApiResponse<any[]>> => {
            return this.request('/api/vibes/generate', {
                method: 'POST',
            });
        },
    };
}

// Create and export singleton instance
export const api = new TrembleAPI(API_BASE_URL);

// Export API client
export default api;
