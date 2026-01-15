// Application Constants

export const APP_CONSTANTS = {
    // User Profile
    MAX_PHOTOS_PER_USER: 6,
    MIN_PHOTOS_REQUIRED: 2,
    MIN_INTERESTS_REQUIRED: 3,
    MAX_INTERESTS: 12,
    MIN_AGE: 16,
    MAX_AGE: 100,
    MIN_BIO_LENGTH: 10,
    MAX_BIO_LENGTH: 200,

    // Posts & Content
    MAX_CAPTION_LENGTH: 150,
    MIN_CAPTION_LENGTH: 1,

    // Discovery
    DAILY_DISCOVERY_LIMIT: 999999, // Unlimited - users can browse all day!
    DISCOVERY_PAGE_SIZE: 10,
    MAX_DISCOVERY_DISTANCE_KM: 100,

    // Connections
    STALE_MATCH_DAYS: 7,

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 50,

    // JWT
    JWT_EXPIRES_IN: '7d',
} as const;

export const INTEREST_OPTIONS = [
    'Photography',
    'Travel',
    'Music',
    'Fitness',
    'Cooking',
    'Art',
    'Reading',
    'Gaming',
    'Nature',
    'Coffee',
    'Fashion',
    'Dancing',
    'Movies',
    'Technology',
    'Sports',
    'Food',
    'Yoga',
    'Hiking',
    'Pets',
    'Writing',
] as const;

export const VIBE_BADGES = [
    'Artsy',
    'Minimal',
    'Sporty',
    'Traveller',
    'Foodie',
    'Coffee Lover',
    'Nature Lover',
    'Music Enthusiast',
    'Bookworm',
    'Tech Geek',
    'Fashion Forward',
    'Fitness Junkie',
    'Creative Soul',
    'Adventure Seeker',
] as const;

export const ICEBREAKER_PROMPTS = [
    { id: '1', text: "What's your go-to coffee order?", category: 'casual' as const },
    { id: '2', text: "If you could travel anywhere tomorrow, where would you go?", category: 'fun' as const },
    { id: '3', text: "What's the last thing that made you laugh?", category: 'casual' as const },
    { id: '4', text: "What's your favorite way to spend a weekend?", category: 'casual' as const },
    { id: '5', text: "What's a skill you'd love to learn?", category: 'deep' as const },
    { id: '6', text: "What's your current favorite song?", category: 'fun' as const },
    { id: '7', text: "What's the best meal you've had recently?", category: 'casual' as const },
    { id: '8', text: "If you could have dinner with anyone, who would it be?", category: 'deep' as const },
    { id: '9', text: "What's something you're passionate about?", category: 'deep' as const },
    { id: '10', text: "What's your hidden talent?", category: 'fun' as const },
    { id: '11', text: "What's your favorite way to relax?", category: 'casual' as const },
    { id: '12', text: "What's the most spontaneous thing you've done?", category: 'creative' as const },
] as const;

export const ERROR_MESSAGES = {
    // Auth
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already registered',
    USERNAME_EXISTS: 'Username already taken',
    UNAUTHORIZED: 'Unauthorized access',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token',

    // User
    USER_NOT_FOUND: 'User not found',
    INVALID_USER_DATA: 'Invalid user data',
    MAX_PHOTOS_EXCEEDED: `Maximum ${APP_CONSTANTS.MAX_PHOTOS_PER_USER} photos allowed`,
    MIN_PHOTOS_REQUIRED: `At least ${APP_CONSTANTS.MIN_PHOTOS_REQUIRED} photos required`,
    MIN_INTERESTS_REQUIRED: `At least ${APP_CONSTANTS.MIN_INTERESTS_REQUIRED} interests required`,

    // Discovery
    DISCOVERY_LIMIT_REACHED: 'Daily discovery limit reached',
    NO_MORE_PROFILES: 'No more profiles to discover',

    // Connections
    ALREADY_CONNECTED: 'Already connected with this user',
    CANNOT_CONNECT_SELF: 'Cannot connect with yourself',
    CONNECTION_NOT_FOUND: 'Connection not found',

    // Messages
    NOT_MATCHED: 'You must match with this user to send messages',
    MESSAGE_NOT_FOUND: 'Message not found',
    CONVERSATION_NOT_FOUND: 'Conversation not found',

    // Posts
    POST_NOT_FOUND: 'Post not found',
    INVALID_CAPTION: 'Caption exceeds maximum length',

    // General
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    FORBIDDEN: 'Access forbidden',
} as const;

export const SUCCESS_MESSAGES = {
    USER_REGISTERED: 'User registered successfully',
    USER_UPDATED: 'User profile updated successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    POST_CREATED: 'Post created successfully',
    POST_DELETED: 'Post deleted successfully',
    MESSAGE_SENT: 'Message sent successfully',
    REPORT_SUBMITTED: 'Report submitted successfully',
    USER_BLOCKED: 'User blocked successfully',
    USER_UNBLOCKED: 'User unblocked successfully',
} as const;
