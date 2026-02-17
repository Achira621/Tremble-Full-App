import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Plus, X, Image as ImageIcon, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';

interface GlimpsePost {
  glimpse: {
    id: string;
    userId: string;
    photoUrl: string;
    caption: string;
    mood: string;
    location?: {
      city?: string;
    };
    musicTrack?: {
      name: string;
      artist: string;
    };
    likes: number;
    commentCount: number;
    createdAt: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    profilePhoto?: string;
  };
  hasLiked: boolean;
  hasTrembled: boolean;
}

interface FeedProps {
  currentUserName: string;
  currentUserPhoto: string;
}

export function Feed({ currentUserName, currentUserPhoto }: FeedProps) {
  const [posts, setPosts] = useState<GlimpsePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostPhoto, setNewPostPhoto] = useState('');
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGlimpses();
  }, []);

  const loadGlimpses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.glimpses.getFeed(20);
      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        setError(response.error || 'Failed to load glimpses');
      }
    } catch (err) {
      console.error('Failed to load glimpses:', err);
      setError('Failed to load glimpses. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (glimpseId: string) => {
    const postIndex = posts.findIndex(p => p.glimpse.id === glimpseId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const newHasLiked = !post.hasLiked;

    setPosts(posts.map((p, i) => 
      i === postIndex 
        ? { 
            ...p, 
            hasLiked: newHasLiked, 
            glimpse: {
              ...p.glimpse,
              likes: newHasLiked ? p.glimpse.likes + 1 : p.glimpse.likes - 1
            }
          } 
        : p
    ));

    try {
      await api.glimpses.like(glimpseId);
    } catch (err) {
      console.error('Failed to like glimpse:', err);
      setPosts(posts.map((p, i) => 
        i === postIndex 
          ? { 
              ...p, 
              hasLiked: post.hasLiked, 
              glimpse: {
                ...p.glimpse,
                likes: post.glimpse.likes
              }
            } 
          : p
      ));
    }
  };

  const handleTremble = async (glimpseId: string) => {
    const postIndex = posts.findIndex(p => p.glimpse.id === glimpseId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const newHasTrembled = !post.hasTrembled;

    setPosts(posts.map((p, i) => 
      i === postIndex 
        ? { ...p, hasTrembled: newHasTrembled } 
        : p
    ));

    try {
      await api.glimpses.tremble(glimpseId);
    } catch (err) {
      console.error('Failed to tremble glimpse:', err);
      setPosts(posts.map((p, i) => 
        i === postIndex 
          ? { ...p, hasTrembled: post.hasTrembled } 
          : p
      ));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostCaption.trim() || !newPostPhoto) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      const response = await fetch(newPostPhoto);
      const blob = await response.blob();
      formData.append('photo', blob, 'photo.jpg');
      formData.append('caption', newPostCaption);
      formData.append('mood', 'happy');

      const createResponse = await api.glimpses.create(formData);
      if (createResponse.success) {
        await loadGlimpses();
      } else {
        alert(createResponse.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
      setNewPostCaption('');
      setNewPostPhoto('');
      setShowCreatePost(false);
    }
  };

  const handlePhotoSelect = () => {
    const randomPhoto = `https://picsum.photos/600/800?random=${Math.floor(Math.random() * 1000)}`;
    setNewPostPhoto(randomPhoto);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading glimpses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadGlimpses}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Glimpses
            </h1>
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center h-[calc(100%-73px)]">
          <div className="text-center px-4">
            <p className="text-gray-600 mb-4">No glimpses yet. Be the first to post!</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium"
            >
              Create Glimpse
            </button>
          </div>
        </div>
        {showCreatePost && (
          <CreatePostModal
            show={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            newPostCaption={newPostCaption}
            setNewPostCaption={setNewPostCaption}
            newPostPhoto={newPostPhoto}
            handlePhotoSelect={handlePhotoSelect}
            handleCreatePost={handleCreatePost}
            submitting={submitting}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Glimpses
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
          <div key={post.glimpse.id} className="bg-white mb-4 shadow-sm">
            {/* Post Header */}
            <div className="px-4 py-3 flex items-center gap-3">
              <img
                src={post.user.profilePhoto || `https://i.pravatar.cc/150?u=${post.user.id}`}
                alt={post.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{post.user.name}</p>
                <p className="text-xs text-gray-500">
                  {post.glimpse.location?.city || ''} • {formatTime(post.glimpse.createdAt)}
                </p>
              </div>
            </div>

            {/* Post Image */}
            <img
              src={post.glimpse.photoUrl}
              alt="Glimpse"
              className="w-full aspect-[3/4] object-cover"
            />

            {/* Post Actions */}
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.glimpse.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <Heart
                    size={24}
                    className={post.hasLiked ? 'text-pink-500 fill-pink-500' : 'text-gray-700'}
                  />
                </button>
                <button
                  onClick={() => setActiveComments(activeComments === post.glimpse.id ? null : post.glimpse.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <MessageCircle size={24} className="text-gray-700" />
                </button>
                <button
                  onClick={() => handleTremble(post.glimpse.id)}
                  className={`hover:scale-110 transition-transform ${post.hasTrembled ? 'text-purple-500' : 'text-gray-700'}`}
                  title="Tremble"
                >
                  <span className="text-lg">✨</span>
                </button>
                <button className="hover:scale-110 transition-transform ml-auto">
                  <Send size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Likes */}
              <p className="font-semibold text-sm text-gray-900">{post.glimpse.likes} likes</p>

              {/* Caption */}
              <p className="text-sm">
                <span className="font-semibold text-gray-900 mr-2">{post.user.name}</span>
                <span className="text-gray-700">{post.glimpse.caption}</span>
                {post.glimpse.mood && (
                  <span className="ml-2 opacity-70">#{post.glimpse.mood}</span>
                )}
              </p>

              {/* Music */}
              {post.glimpse.musicTrack && (
                <p className="text-sm text-gray-500">
                  🎵 {post.glimpse.musicTrack.name} • {post.glimpse.musicTrack.artist}
                </p>
              )}

              {/* Comments */}
              {post.glimpse.commentCount > 0 && !activeComments && (
                <button
                  onClick={() => setActiveComments(post.glimpse.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  View all {post.glimpse.commentCount} comments
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        show={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        newPostCaption={newPostCaption}
        setNewPostCaption={setNewPostCaption}
        newPostPhoto={newPostPhoto}
        handlePhotoSelect={handlePhotoSelect}
        handleCreatePost={handleCreatePost}
        submitting={submitting}
      />
    </div>
  );
}

function CreatePostModal({ show, onClose, newPostCaption, setNewPostCaption, newPostPhoto, handlePhotoSelect, handleCreatePost, submitting }: {
  show: boolean;
  onClose: () => void;
  newPostCaption: string;
  setNewPostCaption: (v: string) => void;
  newPostPhoto: string;
  handlePhotoSelect: () => void;
  handleCreatePost: () => void;
  submitting: boolean;
}) {
  if (!show) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-3xl p-6 z-50 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Glimpse</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
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

          <textarea
            value={newPostCaption}
            onChange={(e) => setNewPostCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors resize-none"
            rows={3}
          />

          <button
            onClick={handleCreatePost}
            disabled={!newPostCaption.trim() || !newPostPhoto || submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={20} />
                Posting...
              </>
            ) : (
              'Share Glimpse'
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
