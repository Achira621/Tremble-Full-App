import { useState } from 'react';
import { Heart, MessageCircle, Send, Plus, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  photo: string;
  caption: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  isLiked: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface FeedProps {
  currentUserName: string;
  currentUserPhoto: string;
}

// Mock posts
const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Alex',
    userPhoto: 'https://i.pravatar.cc/150?img=1',
    photo: 'https://picsum.photos/600/800?random=100',
    caption: 'Sunset vibes ☀️✨ #goldenhour',
    likes: 124,
    comments: [
      { id: '1', userId: '2', userName: 'Jordan', text: 'Stunning! 😍', timestamp: '2h ago' }
    ],
    timestamp: '3h ago',
    isLiked: false
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jordan',
    userPhoto: 'https://i.pravatar.cc/150?img=2',
    photo: 'https://picsum.photos/600/800?random=101',
    caption: 'New art piece finished! What do you think? 🎨',
    likes: 89,
    comments: [],
    timestamp: '5h ago',
    isLiked: false
  },
  {
    id: '3',
    userId: '3',
    userName: 'Sam',
    userPhoto: 'https://i.pravatar.cc/150?img=3',
    photo: 'https://picsum.photos/600/800?random=102',
    caption: 'Morning workout done 💪 Who else is up early?',
    likes: 67,
    comments: [
      { id: '2', userId: '1', userName: 'Alex', text: 'Inspired! 🔥', timestamp: '1h ago' },
      { id: '3', userId: '4', userName: 'Taylor', text: 'Goals!', timestamp: '45m ago' }
    ],
    timestamp: '8h ago',
    isLiked: true
  }
];

export function Feed({ currentUserName, currentUserPhoto }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostPhoto, setNewPostPhoto] = useState('');
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: string) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'current',
      userName: currentUserName,
      text: commentText,
      timestamp: 'Just now'
    };

    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, newComment] }
        : post
    ));

    setCommentText('');
  };

  const handleCreatePost = () => {
    if (!newPostCaption.trim() || !newPostPhoto) return;

    const newPost: Post = {
      id: Date.now().toString(),
      userId: 'current',
      userName: currentUserName,
      userPhoto: currentUserPhoto,
      photo: newPostPhoto,
      caption: newPostCaption,
      likes: 0,
      comments: [],
      timestamp: 'Just now',
      isLiked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostCaption('');
    setNewPostPhoto('');
    setShowCreatePost(false);
  };

  const handlePhotoSelect = () => {
    // Simulate photo selection
    const randomPhoto = `https://picsum.photos/600/800?random=${Math.floor(Math.random() * 1000)}`;
    setNewPostPhoto(randomPhoto);
  };

  return (
    <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Feed
          </h1>
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto pb-20">
        {posts.map((post) => (
          <div key={post.id} className="bg-white mb-4 shadow-sm">
            {/* Post Header */}
            <div className="px-4 py-3 flex items-center gap-3">
              <img
                src={post.userPhoto}
                alt={post.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{post.userName}</p>
                <p className="text-xs text-gray-500">{post.timestamp}</p>
              </div>
            </div>

            {/* Post Image */}
            <img
              src={post.photo}
              alt="Post"
              className="w-full aspect-[3/4] object-cover"
            />

            {/* Post Actions */}
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <Heart
                    size={24}
                    className={post.isLiked ? 'text-pink-500 fill-pink-500' : 'text-gray-700'}
                  />
                </button>
                <button
                  onClick={() => setActiveComments(activeComments === post.id ? null : post.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <MessageCircle size={24} className="text-gray-700" />
                </button>
                <button className="hover:scale-110 transition-transform ml-auto">
                  <Send size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Likes */}
              <p className="font-semibold text-sm text-gray-900">{post.likes} likes</p>

              {/* Caption */}
              <p className="text-sm">
                <span className="font-semibold text-gray-900 mr-2">{post.userName}</span>
                <span className="text-gray-700">{post.caption}</span>
              </p>

              {/* Comments */}
              {post.comments.length > 0 && !activeComments && (
                <button
                  onClick={() => setActiveComments(post.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  View all {post.comments.length} comments
                </button>
              )}

              <AnimatePresence>
                {activeComments === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <span className="font-semibold text-gray-900 mr-2">{comment.userName}</span>
                        <span className="text-gray-700">{comment.text}</span>
                        <span className="text-xs text-gray-500 ml-2">{comment.timestamp}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Comment */}
              {activeComments === post.id && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:bg-gray-200 transition-colors"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!commentText.trim()}
                    className="text-purple-600 font-semibold text-sm disabled:text-gray-400"
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCreatePost(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-3xl p-6 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Photo Selection */}
                {!newPostPhoto ? (
                  <button
                    onClick={handlePhotoSelect}
                    className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600"
                  >
                    <ImageIcon size={48} />
                    <span className="text-sm font-medium">Add Photo</span>
                  </button>
                ) : (
                  <div className="relative">
                    <img
                      src={newPostPhoto}
                      alt="Selected"
                      className="w-full aspect-square rounded-2xl object-cover"
                    />
                    <button
                      onClick={() => setNewPostPhoto('')}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Caption */}
                <textarea
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  rows={3}
                />

                {/* Submit */}
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostCaption.trim() || !newPostPhoto}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Post
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
