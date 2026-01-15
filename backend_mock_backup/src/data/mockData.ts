import bcrypt from 'bcryptjs';
import { dataStore } from './store';
import { User, Post, Connection, Match, Conversation } from '../types';
import { generateId, generateAvatarUrl, generatePhotoUrl, pickRandom } from '../utils/generators';
import { INTEREST_OPTIONS } from '../utils/constants';

/**
 * Seed the data store with mock data for development and testing
 */
export const seedMockData = async (): Promise<void> => {
    console.log('🌱 Seeding mock data...');

    // Clear existing data
    dataStore.clear();

    // Create mock users
    const mockUsers = await createMockUsers();

    // Create mock posts
    createMockPosts(mockUsers);

    // Create some mock connections and matches
    createMockConnections(mockUsers);

    console.log(`✅ Seeded ${mockUsers.length} users with posts and connections`);
};

/**
 * Create mock users
 */
const createMockUsers = async (): Promise<User[]> => {
    const userNames = [
        { name: 'Alex Rivera', username: 'alex_r', age: 26 },
        { name: 'Jordan Lee', username: 'jordan_lee', age: 24 },
        { name: 'Sam Chen', username: 'sam_chen', age: 28 },
        { name: 'Taylor Morgan', username: 'taylor_m', age: 25 },
        { name: 'Casey Kim', username: 'casey_kim', age: 27 },
        { name: 'Riley Parker', username: 'riley_p', age: 23 },
        { name: 'Morgan Blake', username: 'morgan_b', age: 29 },
        { name: 'Avery Stone', username: 'avery_s', age: 22 },
        { name: 'Quinn Davis', username: 'quinn_d', age: 26 },
        { name: 'Skyler Reed', username: 'skyler_r', age: 24 },
    ];

    const bios = [
        'Coffee enthusiast ☕ | Adventure seeker 🏔️ | Always up for trying new restaurants',
        'Artist 🎨 | Music lover 🎵 | Weekend warrior',
        'Fitness junkie 💪 | Cooking experiments in progress 👨‍🍳',
        'Book nerd 📚 | Plant parent 🌱 | Dog lover 🐕',
        'Tech geek 💻 | Gamer 🎮 | Amateur photographer 📷',
        'Traveler ✈️ | Foodie 🍜 | Sunset chaser 🌅',
        'Yoga instructor 🧘 | Minimalist | Nature enthusiast',
        'Creative soul 🎭 | Coffee addict | City explorer',
        'Outdoor adventurer 🏕️ | Photographer | Music festival goer',
        'Fashion lover 👗 | Brunch enthusiast | Beach person 🏖️',
    ];

    const users: User[] = [];
    const passwordHash = await bcrypt.hash('password123', 10);

    for (let i = 0; i < userNames.length; i++) {
        const { name, username, age } = userNames[i];
        const userId = generateId();

        const user: User = {
            id: userId,
            email: `${username}@example.com`,
            username,
            passwordHash,
            name,
            age,
            bio: bios[i],
            photos: [
                {
                    id: generateId(),
                    url: generateAvatarUrl(i * 10),
                    order: 0,
                    uploadedAt: new Date(),
                },
                {
                    id: generateId(),
                    url: generatePhotoUrl(i * 10 + 1),
                    order: 1,
                    uploadedAt: new Date(),
                },
                {
                    id: generateId(),
                    url: generatePhotoUrl(i * 10 + 2),
                    order: 2,
                    uploadedAt: new Date(),
                },
            ],
            interests: pickRandom([...INTEREST_OPTIONS], 5),
            location: {
                city: ['New York', 'Los Angeles', 'Chicago', 'Austin', 'Seattle'][i % 5],
                radiusKm: 50,
                enabled: true,
            },
            settings: {
                privacyMode: 'public',
                showLocation: true,
                showAge: true,
                discoveryEnabled: true,
                notificationsEnabled: true,
                emailNotifications: false,
            },
            vibeBadges: [],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            lastActive: new Date(),
        };

        dataStore.createUser(user);
        users.push(user);
    }

    return users;
};

/**
 * Create mock posts
 */
const createMockPosts = (users: User[]): void => {
    const captions = [
        'Perfect morning vibes ☀️',
        'Found this gem today 💎',
        'Living my best life',
        'Weekend mood 🌟',
        'New adventures await',
        'Grateful for moments like these',
        'Making memories',
        'Chasing dreams',
        'Good times, good vibes',
        'Life is beautiful',
    ];

    users.forEach((user, userIndex) => {
        // Create 2-4 posts per user
        const numPosts = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numPosts; i++) {
            const post: Post = {
                id: generateId(),
                userId: user.id,
                photoUrl: generatePhotoUrl(userIndex * 100 + i),
                caption: captions[Math.floor(Math.random() * captions.length)],
                createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            };

            dataStore.createPost(post);
        }
    });
};

/**
 * Create mock connections and matches
 */
const createMockConnections = (users: User[]): void => {
    if (users.length < 2) return;

    // Create some likes and matches between users
    for (let i = 0; i < Math.min(5, users.length - 1); i++) {
        const user1 = users[i];
        const user2 = users[i + 1];

        // User 1 likes User 2
        const connection1: Connection = {
            id: generateId(),
            fromUserId: user1.id,
            toUserId: user2.id,
            action: 'tremble',
            status: 'matched',
            createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
            lastInteractionAt: new Date(),
        };
        dataStore.createConnection(connection1);

        // User 2 likes User 1 back (mutual match)
        const connection2: Connection = {
            id: generateId(),
            fromUserId: user2.id,
            toUserId: user1.id,
            action: 'tremble',
            status: 'matched',
            createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
            lastInteractionAt: new Date(),
        };
        dataStore.createConnection(connection2);

        // Create a match
        const match: Match = {
            id: generateId(),
            user1Id: user1.id,
            user2Id: user2.id,
            matchedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
            conversationId: generateId(),
            isActive: true,
            lastMessageAt: new Date(),
        };
        dataStore.createMatch(match);

        // Create a conversation
        const conversation: Conversation = {
            id: match.conversationId,
            user1Id: user1.id,
            user2Id: user2.id,
            matchId: match.id,
            lastMessageAt: new Date(),
            unreadCount: {
                [user1.id]: 0,
                [user2.id]: 0,
            },
            createdAt: match.matchedAt,
        };
        dataStore.createConversation(conversation);
    }
};
