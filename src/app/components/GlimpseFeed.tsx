import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Avatar, CircularProgress, Fade, Slide } from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    ChatBubbleOutline,
    MoreVert,
    MusicNote,
    Close,
    Bolt
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface GlimpseFeedProps {
    onClose: () => void;
}

const GlimpseFeed: React.FC<GlimpseFeedProps> = ({ onClose }) => {
    const [glimpses, setGlimpses] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressInterval = useRef<NodeJS.Timeout>();

    const AUTO_ADVANCE_TIME = 5000; // 5 seconds per glimpse

    useEffect(() => {
        loadFeed();
        return () => clearInterval(progressInterval.current);
    }, []);

    const loadFeed = async () => {
        try {
            setLoading(true);
            const response = await api.glimpses.getFeed(20);
            if (response.success && response.data) {
                setGlimpses(response.data);
            }
        } catch (error) {
            console.error('Failed to load glimpses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-advance logic
    useEffect(() => {
        if (loading || glimpses.length === 0 || isPaused) return;

        const startTime = Date.now();

        // Clear existing interval
        if (progressInterval.current) clearInterval(progressInterval.current);

        // Start progress timer
        progressInterval.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / AUTO_ADVANCE_TIME) * 100;

            if (newProgress >= 100) {
                handleNext();
            } else {
                setProgress(newProgress);
            }
        }, 50);

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, loading, isPaused, glimpses.length]);

    // Record view logic
    useEffect(() => {
        if (glimpses[currentIndex]) {
            const glimpseId = glimpses[currentIndex].glimpse.id;
            // Record view after 1 second
            const timer = setTimeout(() => {
                api.glimpses.recordView(glimpseId, 1.0);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, glimpses]);

    const handleNext = () => {
        if (currentIndex < glimpses.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            // Load more or loop? For now, close or reset
            // loadFeed(); // Could load more
            setCurrentIndex(0); // Loop for demo
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentGlimpse = glimpses[currentIndex];
        if (!currentGlimpse) return;

        // Optimistic update
        const updatedGlimpses = [...glimpses];
        updatedGlimpses[currentIndex].hasLiked = !updatedGlimpses[currentIndex].hasLiked;
        updatedGlimpses[currentIndex].glimpse.likes += updatedGlimpses[currentIndex].hasLiked ? 1 : -1;
        setGlimpses(updatedGlimpses);

        await api.glimpses.like(currentGlimpse.glimpse.id);
    };

    const handleTremble = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentGlimpse = glimpses[currentIndex];
        if (!currentGlimpse) return;

        // Optimistic update
        const updatedGlimpses = [...glimpses];
        updatedGlimpses[currentIndex].hasTrembled = true;
        setGlimpses(updatedGlimpses);

        const response = await api.glimpses.tremble(currentGlimpse.glimpse.id);
        if (response.success && response.data?.matched) {
            // Show match popup (TODO)
            alert("It's a Match! 🎉");
        }
    };

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsPaused(true);
    };

    const handleTouchEnd = () => {
        setIsPaused(false);
    };

    if (loading) {
        return (
            <Box sx={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#000'
            }}>
                <CircularProgress sx={{ color: '#FF4B8B' }} />
            </Box>
        );
    }

    const currentItem = glimpses[currentIndex];
    if (!currentItem) return null;

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#000',
                zIndex: 1300,
                overflow: 'hidden',
            }}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <AnimatePresence initial={false}>
                <motion.div
                    key={currentItem.glimpse.id}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {/* Main Photo */}
                    <img
                        src={currentItem.glimpse.photoUrl}
                        alt="Glimpse"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    {/* Gradient Overlay */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '50%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                        }}
                    />

                    {/* Progress Bar */}
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        <Box
                            sx={{
                                height: '100%',
                                width: `${progress}%`,
                                bgcolor: '#fff',
                                transition: 'width 0.1s linear'
                            }}
                        />
                    </Box>

                    {/* Content Overlay */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 3,
                            pb: 10, // Space for bottom nav if needed
                            color: '#fff',
                        }}
                    >
                        {/* User Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                src={currentItem.user.photos?.[0]?.url}
                                sx={{ width: 48, height: 48, border: '2px solid #fff', mr: 2 }}
                            />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    @{currentItem.user.name}, {currentItem.user.age}
                                </Typography>
                                {currentItem.glimpse.location && (
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        📍 {currentItem.glimpse.location.city}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Caption & Mood */}
                        <Typography variant="body1" sx={{ mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {currentItem.glimpse.caption}
                            <span style={{ opacity: 0.7, marginLeft: 8 }}>#{currentItem.glimpse.mood}</span>
                        </Typography>

                        {/* Music */}
                        {currentItem.glimpse.musicTrack && (
                            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8, mt: 1 }}>
                                <MusicNote sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">
                                    {currentItem.glimpse.musicTrack.name} • {currentItem.glimpse.musicTrack.artist}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Action Buttons (Right Side) */}
                    <Box
                        sx={{
                            position: 'absolute',
                            right: 16,
                            bottom: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        {/* Like Button */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconButton
                                onClick={handleLike}
                                sx={{
                                    color: currentItem.hasLiked ? '#FF4B8B' : '#fff',
                                    bgcolor: 'rgba(0,0,0,0.3)',
                                    p: 1.5,
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                                }}
                            >
                                {currentItem.hasLiked ? <Favorite /> : <FavoriteBorder />}
                            </IconButton>
                            <Typography variant="caption" sx={{ color: '#fff', mt: 0.5, fontWeight: 600 }}>
                                {currentItem.glimpse.likes}
                            </Typography>
                        </Box>

                        {/* Tremble Button (Super Like) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconButton
                                onClick={handleTremble}
                                sx={{
                                    color: currentItem.hasTrembled ? '#9D4EDD' : '#fff',
                                    bgcolor: 'rgba(0,0,0,0.3)',
                                    p: 1.5,
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                                }}
                            >
                                <Bolt />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: '#fff', mt: 0.5, fontWeight: 600 }}>
                                Tremble
                            </Typography>
                        </Box>

                        {/* Comment Button */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconButton
                                sx={{
                                    color: '#fff',
                                    bgcolor: 'rgba(0,0,0,0.3)',
                                    p: 1.5,
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                                }}
                            >
                                <ChatBubbleOutline />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: '#fff', mt: 0.5, fontWeight: 600 }}>
                                {currentItem.glimpse.comments}
                            </Typography>
                        </Box>

                        {/* More Button */}
                        <IconButton
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(0,0,0,0.3)',
                                p: 1,
                                mt: 1
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                    </Box>

                    {/* Close Button */}
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: '#fff',
                            zIndex: 10
                        }}
                    >
                        <Close />
                    </IconButton>
                </motion.div>
            </AnimatePresence>
        </Box>
    );
};

export default GlimpseFeed;
