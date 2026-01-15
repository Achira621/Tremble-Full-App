import {
    User,
    Post,
    Connection,
    Message,
    Conversation,
    Match,
    VibeBadge,
    Report,
    BlockedUser,
    DiscoveryPreferences,
} from '../types';
import {
    DailyStreak,
    Achievement,
    Notification,
    SecretAdmirer,
    DailyReward,
    ActivityHighlight,
    MysteryBox,
} from '../types/engagement';
import { Glimpse, GlimpseInteraction, GlimpseComment } from '../types/glimpses';

// ============================================
// IN-MEMORY DATA STORE (Database Placeholder)
// ============================================

class DataStore {
    // Collections
    private users: Map<string, User> = new Map();
    private posts: Map<string, Post> = new Map();
    private connections: Map<string, Connection> = new Map();
    private messages: Map<string, Message> = new Map();
    private conversations: Map<string, Conversation> = new Map();
    private matches: Map<string, Match> = new Map();
    private vibeBadges: Map<string, VibeBadge[]> = new Map();
    private reports: Map<string, Report> = new Map();
    private blockedUsers: Map<string, BlockedUser> = new Map();
    private discoveryPreferences: Map<string, DiscoveryPreferences> = new Map();

    // Engagement Collections
    private dailyStreaks: Map<string, DailyStreak> = new Map();
    private achievements: Map<string, Achievement[]> = new Map();
    private notifications: Map<string, Notification> = new Map();
    private secretAdmirers: Map<string, SecretAdmirer> = new Map();
    private dailyRewards: Map<string, DailyReward[]> = new Map();
    private activityHighlights: Map<string, ActivityHighlight[]> = new Map();
    private mysteryBoxes: Map<string, MysteryBox> = new Map();

    // Glimpses Collections
    private glimpses: Map<string, Glimpse> = new Map();
    private glimpseInteractions: Map<string, GlimpseInteraction> = new Map();
    private glimpseComments: Map<string, GlimpseComment> = new Map();

    // User tracking
    private usersByEmail: Map<string, string> = new Map(); // email -> userId
    private usersByUsername: Map<string, string> = new Map(); // username -> userId
    private userDiscoveryCount: Map<string, { date: string; count: number }> = new Map();

    // ============================================
    // USER OPERATIONS
    // ============================================

    createUser(user: User): void {
        this.users.set(user.id, user);
        this.usersByEmail.set(user.email.toLowerCase(), user.id);
        this.usersByUsername.set(user.username.toLowerCase(), user.id);
    }

    getUser(userId: string): User | undefined {
        return this.users.get(userId);
    }

    getUserByEmail(email: string): User | undefined {
        const userId = this.usersByEmail.get(email.toLowerCase());
        return userId ? this.users.get(userId) : undefined;
    }

    getUserByUsername(username: string): User | undefined {
        const userId = this.usersByUsername.get(username.toLowerCase());
        return userId ? this.users.get(userId) : undefined;
    }

    updateUser(userId: string, updates: Partial<User>): User | undefined {
        const user = this.users.get(userId);
        if (!user) return undefined;

        const updatedUser = { ...user, ...updates, updatedAt: new Date() };
        this.users.set(userId, updatedUser);
        return updatedUser;
    }

    getAllUsers(): User[] {
        return Array.from(this.users.values());
    }

    // ============================================
    // POST OPERATIONS
    // ============================================

    createPost(post: Post): void {
        this.posts.set(post.id, post);
    }

    getPost(postId: string): Post | undefined {
        return this.posts.get(postId);
    }

    getUserPosts(userId: string): Post[] {
        return Array.from(this.posts.values())
            .filter(post => post.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    deletePost(postId: string): boolean {
        return this.posts.delete(postId);
    }

    getAllPosts(): Post[] {
        return Array.from(this.posts.values());
    }

    // ============================================
    // CONNECTION OPERATIONS
    // ============================================

    createConnection(connection: Connection): void {
        this.connections.set(connection.id, connection);
    }

    getConnection(connectionId: string): Connection | undefined {
        return this.connections.get(connectionId);
    }

    getConnectionBetweenUsers(userId1: string, userId2: string): Connection | undefined {
        return Array.from(this.connections.values()).find(
            conn =>
                (conn.fromUserId === userId1 && conn.toUserId === userId2) ||
                (conn.fromUserId === userId2 && conn.toUserId === userId1)
        );
    }

    getUserConnections(userId: string): Connection[] {
        return Array.from(this.connections.values()).filter(
            conn => conn.fromUserId === userId || conn.toUserId === userId
        );
    }

    updateConnection(connectionId: string, updates: Partial<Connection>): Connection | undefined {
        const connection = this.connections.get(connectionId);
        if (!connection) return undefined;

        const updated = { ...connection, ...updates };
        this.connections.set(connectionId, updated);
        return updated;
    }

    deleteConnection(connectionId: string): boolean {
        return this.connections.delete(connectionId);
    }

    // ============================================
    // MATCH OPERATIONS
    // ============================================

    createMatch(match: Match): void {
        this.matches.set(match.id, match);
    }

    getMatch(matchId: string): Match | undefined {
        return this.matches.get(matchId);
    }

    getMatchBetweenUsers(userId1: string, userId2: string): Match | undefined {
        return Array.from(this.matches.values()).find(
            match =>
                (match.user1Id === userId1 && match.user2Id === userId2) ||
                (match.user1Id === userId2 && match.user2Id === userId1)
        );
    }

    getUserMatches(userId: string): Match[] {
        return Array.from(this.matches.values()).filter(
            match => (match.user1Id === userId || match.user2Id === userId) && match.isActive
        );
    }

    updateMatch(matchId: string, updates: Partial<Match>): Match | undefined {
        const match = this.matches.get(matchId);
        if (!match) return undefined;

        const updated = { ...match, ...updates };
        this.matches.set(matchId, updated);
        return updated;
    }

    // ============================================
    // MESSAGE & CONVERSATION OPERATIONS
    // ============================================

    createConversation(conversation: Conversation): void {
        this.conversations.set(conversation.id, conversation);
    }

    getConversation(conversationId: string): Conversation | undefined {
        return this.conversations.get(conversationId);
    }

    getConversationBetweenUsers(userId1: string, userId2: string): Conversation | undefined {
        return Array.from(this.conversations.values()).find(
            conv =>
                (conv.user1Id === userId1 && conv.user2Id === userId2) ||
                (conv.user1Id === userId2 && conv.user2Id === userId1)
        );
    }

    getUserConversations(userId: string): Conversation[] {
        return Array.from(this.conversations.values())
            .filter(conv => conv.user1Id === userId || conv.user2Id === userId)
            .sort((a, b) => {
                const aTime = a.lastMessageAt?.getTime() || 0;
                const bTime = b.lastMessageAt?.getTime() || 0;
                return bTime - aTime;
            });
    }

    updateConversation(conversationId: string, updates: Partial<Conversation>): Conversation | undefined {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return undefined;

        const updated = { ...conversation, ...updates };
        this.conversations.set(conversationId, updated);
        return updated;
    }

    createMessage(message: Message): void {
        this.messages.set(message.id, message);
    }

    getMessage(messageId: string): Message | undefined {
        return this.messages.get(messageId);
    }

    getConversationMessages(conversationId: string): Message[] {
        return Array.from(this.messages.values())
            .filter(msg => msg.conversationId === conversationId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    updateMessage(messageId: string, updates: Partial<Message>): Message | undefined {
        const message = this.messages.get(messageId);
        if (!message) return undefined;

        const updated = { ...message, ...updates };
        this.messages.set(messageId, updated);
        return updated;
    }

    // ============================================
    // VIBE BADGE OPERATIONS
    // ============================================

    setUserVibeBadges(userId: string, badges: VibeBadge[]): void {
        this.vibeBadges.set(userId, badges);
    }

    getUserVibeBadges(userId: string): VibeBadge[] {
        return this.vibeBadges.get(userId) || [];
    }

    // ============================================
    // SAFETY OPERATIONS
    // ============================================

    createReport(report: Report): void {
        this.reports.set(report.id, report);
    }

    getReport(reportId: string): Report | undefined {
        return this.reports.get(reportId);
    }

    getAllReports(): Report[] {
        return Array.from(this.reports.values());
    }

    blockUser(block: BlockedUser): void {
        this.blockedUsers.set(block.id, block);
    }

    unblockUser(userId: string, blockedUserId: string): boolean {
        const block = Array.from(this.blockedUsers.values()).find(
            b => b.userId === userId && b.blockedUserId === blockedUserId
        );
        if (block) {
            return this.blockedUsers.delete(block.id);
        }
        return false;
    }

    isUserBlocked(userId: string, targetUserId: string): boolean {
        return Array.from(this.blockedUsers.values()).some(
            b =>
                (b.userId === userId && b.blockedUserId === targetUserId) ||
                (b.userId === targetUserId && b.blockedUserId === userId)
        );
    }

    getBlockedUsers(userId: string): BlockedUser[] {
        return Array.from(this.blockedUsers.values()).filter(b => b.userId === userId);
    }

    // ============================================
    // DISCOVERY OPERATIONS
    // ============================================

    setDiscoveryPreferences(prefs: DiscoveryPreferences): void {
        this.discoveryPreferences.set(prefs.userId, prefs);
    }

    getDiscoveryPreferences(userId: string): DiscoveryPreferences | undefined {
        return this.discoveryPreferences.get(userId);
    }

    incrementDiscoveryCount(userId: string): number {
        const today = new Date().toISOString().split('T')[0];
        const current = this.userDiscoveryCount.get(userId);

        if (current && current.date === today) {
            current.count++;
            this.userDiscoveryCount.set(userId, current);
            return current.count;
        } else {
            this.userDiscoveryCount.set(userId, { date: today, count: 1 });
            return 1;
        }
    }

    getDiscoveryCount(userId: string): number {
        const today = new Date().toISOString().split('T')[0];
        const current = this.userDiscoveryCount.get(userId);
        return current && current.date === today ? current.count : 0;
    }

    // ============================================
    // ENGAGEMENT OPERATIONS
    // ============================================

    // Daily Streaks
    getDailyStreak(userId: string): DailyStreak | undefined {
        return this.dailyStreaks.get(userId);
    }

    setDailyStreak(userId: string, streak: DailyStreak): void {
        this.dailyStreaks.set(userId, streak);
    }

    // Achievements
    getUserAchievements(userId: string): Achievement[] {
        return this.achievements.get(userId) || [];
    }

    addAchievement(achievement: Achievement): void {
        const current = this.achievements.get(achievement.userId) || [];
        current.push(achievement);
        this.achievements.set(achievement.userId, current);
    }

    // Notifications
    addNotification(notification: Notification): void {
        this.notifications.set(notification.id, notification);
    }

    getNotification(notificationId: string): Notification | undefined {
        return this.notifications.get(notificationId);
    }

    getUserNotifications(userId: string): Notification[] {
        return Array.from(this.notifications.values()).filter(n => n.userId === userId);
    }

    updateNotification(notificationId: string, updates: Partial<Notification>): Notification | undefined {
        const notification = this.notifications.get(notificationId);
        if (!notification) return undefined;

        const updated = { ...notification, ...updates };
        this.notifications.set(notificationId, updated);
        return updated;
    }

    getAllMessages(): Message[] {
        return Array.from(this.messages.values());
    }

    // Secret Admirers
    addSecretAdmirer(admirer: SecretAdmirer): void {
        this.secretAdmirers.set(admirer.id, admirer);
    }

    getSecretAdmirers(userId: string): SecretAdmirer[] {
        return Array.from(this.secretAdmirers.values()).filter(a => a.targetUserId === userId);
    }

    updateSecretAdmirer(admirerId: string, updates: Partial<SecretAdmirer>): void {
        const admirer = this.secretAdmirers.get(admirerId);
        if (admirer) {
            const updated = { ...admirer, ...updates };
            this.secretAdmirers.set(admirerId, updated);
        }
    }

    // Daily Rewards
    getDailyRewards(userId: string): DailyReward[] {
        return this.dailyRewards.get(userId) || [];
    }

    addDailyReward(reward: DailyReward): void {
        const current = this.dailyRewards.get(reward.userId) || [];
        current.push(reward);
        this.dailyRewards.set(reward.userId, current);
    }

    // Activity Highlights
    getActivityHighlights(userId: string): ActivityHighlight[] {
        return this.activityHighlights.get(userId) || [];
    }

    addActivityHighlight(highlight: ActivityHighlight): void {
        const current = this.activityHighlights.get(highlight.userId) || [];
        current.push(highlight);
        this.activityHighlights.set(highlight.userId, current);
    }

    // Mystery Boxes
    getMysteryBoxes(userId: string): MysteryBox[] {
        return Array.from(this.mysteryBoxes.values()).filter(b => b.userId === userId);
    }

    getMysteryBox(boxId: string): MysteryBox | undefined {
        return this.mysteryBoxes.get(boxId);
    }

    addMysteryBox(box: MysteryBox): void {
        this.mysteryBoxes.set(box.id, box);
    }

    updateMysteryBox(boxId: string, updates: Partial<MysteryBox>): void {
        const box = this.mysteryBoxes.get(boxId);
        if (box) {
            const updated = { ...box, ...updates };
            this.mysteryBoxes.set(boxId, updated);
        }
    }

    // ============================================
    // GLIMPSES METHODS
    // ============================================

    createGlimpse(glimpse: Glimpse): void {
        this.glimpses.set(glimpse.id, glimpse);
    }

    getGlimpse(id: string): Glimpse | undefined {
        return this.glimpses.get(id);
    }

    getGlimpses(): Glimpse[] {
        return Array.from(this.glimpses.values());
    }

    deleteGlimpse(id: string): boolean {
        return this.glimpses.delete(id);
    }

    createGlimpseInteraction(interaction: GlimpseInteraction): void {
        this.glimpseInteractions.set(interaction.id, interaction);
    }

    getGlimpseInteractions(glimpseId: string): GlimpseInteraction[] {
        return Array.from(this.glimpseInteractions.values())
            .filter(i => i.glimpseId === glimpseId);
    }

    createGlimpseComment(comment: GlimpseComment): void {
        this.glimpseComments.set(comment.id, comment);
    }

    getGlimpseComments(glimpseId: string): GlimpseComment[] {
        return Array.from(this.glimpseComments.values())
            .filter(c => c.glimpseId === glimpseId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    countGlimpseInteractions(glimpseId: string, type: string): number {
        return Array.from(this.glimpseInteractions.values())
            .filter(i => i.glimpseId === glimpseId && i.type === type)
            .length;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    clear(): void {
        this.users.clear();
        this.posts.clear();
        this.connections.clear();
        this.messages.clear();
        this.conversations.clear();
        this.matches.clear();
        this.vibeBadges.clear();
        this.reports.clear();
        this.blockedUsers.clear();
        this.discoveryPreferences.clear();
        this.usersByEmail.clear();
        this.usersByUsername.clear();
        this.userDiscoveryCount.clear();

        // Clear engagement data
        this.dailyStreaks.clear();
        this.achievements.clear();
        this.notifications.clear();
        this.secretAdmirers.clear();
        this.dailyRewards.clear();
        this.activityHighlights.clear();
        this.mysteryBoxes.clear();
    }
}

// Singleton instance
export const dataStore = new DataStore();
