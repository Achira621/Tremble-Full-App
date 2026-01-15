import React, { useRef, useState } from 'react';
import { Camera, X, Upload, Music, MapPin, Tag } from 'lucide-react';
import api from '../../services/api';

interface CreateGlimpseModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateGlimpseModal({ onClose, onSuccess }: CreateGlimpseModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('caption', caption);
            formData.append('mood', 'vibing'); // Default mood for now

            const response = await api.glimpses.create(formData);

            if (response.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload glimpse');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-lg font-bold">New Glimpse</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">

                    {/* File Picker */}
                    <div
                        className="aspect-[4/5] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => !file && fileInputRef.current?.click()}
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setPreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/70"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Camera size={28} />
                                </div>
                                <p className="font-semibold text-gray-900">Upload a Photo</p>
                                <p className="text-sm text-gray-500 mt-1">Tap to select from gallery</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Caption Input */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                        />

                        {/* Quick Actions (Visual only for now) */}
                        <div className="flex gap-2 text-gray-400">
                            <button className="flex-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 text-xs font-medium">
                                <Music size={14} /> Add Music
                            </button>
                            <button className="flex-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 text-xs font-medium">
                                <MapPin size={14} /> Location
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!file || uploading}
                        className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all ${!file || uploading
                                ? 'bg-gray-300 shadow-none cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        {uploading ? (
                            <>Uploading...</>
                        ) : (
                            <>
                                <Upload size={18} /> Post Glimpse
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}
