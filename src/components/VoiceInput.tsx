'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Waves, X, Zap, Loader2 } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useLiveAgent } from '../agent/useLiveAgent';
import { cn } from '@/lib/utils';

export const VoiceInput: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { sendMessage, isProcessing, agentStatus } = useLiveAgent();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [volume, setVolume] = useState(0);
    
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Volume Analysis Loop
    const startVolumeAnalysis = async () => {
        try {
            // Optimized constraints for analysis without triggering "Communication Mode" ducking
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: false, 
                    autoGainControl: false, 
                    noiseSuppression: false 
                } 
            });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            
            analyser.fftSize = 256;
            source.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const analyze = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setVolume(average); 
                animationFrameRef.current = requestAnimationFrame(analyze);
            };
            analyze();
        } catch (err) {
            console.error("Microphone access denied:", err);
        }
    };

    const stopVolumeAnalysis = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        setVolume(0);
    };

    const startRecording = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        const currentLang = i18n.language || 'en';
        const langMap: Record<string, string> = {
            'en': 'en-US', 'ar': 'ar-SA', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE'
        };
        
        recognition.lang = langMap[currentLang.split('-')[0]] || currentLang || navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false; // Ensure it doesn't stay open too long

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
            transcriptRef.current = '';
            startVolumeAnalysis();
            
            // Set Media Session to prevent audio ducking/muting on mobile and desktop
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            setTranscript(currentText);
            transcriptRef.current = currentText;
        };

        recognition.onend = () => {
            setIsListening(false);
            stopVolumeAnalysis();
            
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }

            const final = transcriptRef.current;
            if (final.trim() && !isProcessing) {
                sendMessage(final);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Recognition Error:", event.error);
            setIsListening(false);
            stopVolumeAnalysis();
        };

        recognition.start();
    }, [isProcessing, sendMessage, i18n.language]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return (
        <div className="fixed bottom-8 ltr:left-8 rtl:right-8 z-[1100]">
            <div className="relative group">
                {/* Visual Audio Rings */}
                <AnimatePresence>
                    {isListening && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 1, opacity: 0.5 }}
                                    animate={{ 
                                        scale: 1 + (volume / 50) * i, 
                                        opacity: 0,
                                        transition: { repeat: Infinity, duration: 1.5, ease: "easeOut" }
                                    }}
                                    className="absolute w-12 h-12 rounded-full border border-emerald-500/50"
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isListening ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 relative z-20 overflow-hidden",
                        isListening 
                            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/40" 
                            : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40",
                        isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {/* Inner Glow Pulse */}
                    <AnimatePresence>
                        {isListening && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white"
                            />
                        )}
                    </AnimatePresence>

                    {isProcessing ? (
                        <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
                    ) : isListening ? (
                        <Mic className="w-6 h-6 text-white" />
                    ) : (
                        <Mic className="w-6 h-6 text-slate-900" />
                    )}
                </motion.button>
                
                {/* Expandable Transcript Panel */}
                <AnimatePresence>
                    {isListening && (
                        <motion.div 
                            initial={{ x: 20, opacity: 0, scale: 0.9 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: 20, opacity: 0, scale: 0.9 }}
                            className="absolute ltr:left-20 rtl:right-20 top-1/2 -translate-y-1/2 w-64 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5 items-end h-3">
                                        {[1,2,3,4].map(i => (
                                            <motion.div 
                                                key={i}
                                                animate={{ height: [4, volume/10 + (Math.random()*4), 4] }}
                                                transition={{ repeat: Infinity, duration: 0.5 }}
                                                className="w-0.5 bg-emerald-500 rounded-full"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Listening</span>
                                </div>
                                <X size={12} className="text-white/20 hover:text-white transition-colors cursor-pointer" onClick={stopRecording} />
                            </div>
                            <p className="text-[12px] text-white font-medium leading-relaxed italic pr-2">
                                {transcript || 'Awaiting transmission...'}
                            </p>
                            
                            {/* Level Indicator Bar */}
                            <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-emerald-500"
                                    animate={{ width: `${Math.min(100, (volume / 1.5))}%` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Indicator */}
                {!isListening && agentStatus !== 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 left-0 whitespace-nowrap px-3 py-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"
                    >
                        <Zap size={10} className={agentStatus === 'alert' ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
                        {agentStatus}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
