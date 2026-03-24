'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useAppStore, AgentMessage, LatLng } from '../store/useAppStore';
import { AGENT_SYSTEM_PROMPT, AGENT_MODEL_CONFIG } from './agentConfig';
import { agentTools } from './agentTools';

export function useLiveAgent() {
  const { i18n } = useTranslation();
  const { 
    userLocation, 
    heatGuardianMode, 
    agentStatus, 
    setAgentStatus, 
    addAgentMessage, 
    agentMessages,
    clearMessages,
    isAgentProcessing,
    setIsAgentProcessing,
    agentError,
    setAgentError,
    activeModel,
    agentMuted
  } = useAppStore();

  const conversationHistory = useRef<any[]>([]);
  
  // SPEECH SYNTHESIS ENGINE (Shared instance logic)
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        synthRef.current = window.speechSynthesis;
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const currentLang = i18n.language || 'en';
            
            // Prioritize higher-quality "Natural" or "Premium" sounding voices for current lang
            const preferred = voices.find(v => 
                v.lang.startsWith(currentLang) && 
                (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Google'))
            ) || voices.find(v => v.lang.startsWith(currentLang)) || voices[0];
            
            voiceRef.current = preferred || null;
            console.log(`[Agent] Link established with voice: ${preferred?.name} (${preferred?.lang})`);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [i18n.language]);

  // Instant kill-switch for speech when muted
  useEffect(() => {
    if (agentMuted && synthRef.current) {
        synthRef.current.cancel();
    }
  }, [agentMuted]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !text || agentMuted) return;
    try {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) {
            utterance.voice = voiceRef.current;
            utterance.lang = voiceRef.current.lang;
        }
        utterance.rate = 1.05;
        utterance.pitch = i18n.language === 'ar' ? 1.0 : 0.95;
        synthRef.current.speak(utterance);
    } catch (e) {
        console.error("Speech Synthesis Error:", e);
    }
  }, [agentMuted, i18n.language]);

  /**
   * CORE: Send a message to Gemini and handle streaming + tool calls
   * Includes recursive follow-up for autonomous data analysis.
   */
  const sendMessage = useCallback(async (text: string, imageBase64?: string, depth = 0) => {
    if (!text.trim() && !imageBase64) return;
    
    console.log(`[Agent] ${depth > 0 ? 'Follow-up (Depth ' + depth + ')' : 'Query'}: "${text.substring(0, 50)}..."`);
    setIsAgentProcessing(true);
    setAgentError(null);
    setAgentStatus('processing');
    
    // Add user message to UI store only if not a hidden system follow-up
    if (depth === 0) {
      addAgentMessage({ role: 'user', text });
    }

    let toolResults: any[] = [];

    try {
      const resp = await fetch('/api/agent-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          history: conversationHistory.current.slice(-10),
          imageBase64,
          guardianMode: heatGuardianMode,
          userLocation,
          activeModel,
          language: i18n.language
        }),
      });

      if (!resp.ok) {
          const body = await resp.json();
          throw new Error(body.error || 'Connection failure.');
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No communication stream found.');

      const decoder = new TextDecoder();
      let streamedResponse = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(trimmed.replace('data: ', ''));

            if (data.type === 'token') {
              streamedResponse += data.text;
            } else if (data.type === 'tool_call') {
              setAgentStatus('action');
              const { name, args } = data;
                if (agentTools[name as keyof typeof agentTools]) {
                  console.log(`[Agent] Executing tool: ${name}`);
                  const result = await (agentTools[name as keyof typeof agentTools] as any)(args);
                  
                  if (result?._isReport && typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('AGENT_SUBMIT_REPORT', { detail: result.reportData }));
                  }

                  // Only trigger autonomous follow-up for real model turns (Gemini function calls)
                  // Simulated fallback tools already provide their own complete context.
                  if (!data.isSimulated) {
                    toolResults.push({ name, result });
                  }
                }
            } else if (data.type === 'response') {
                const finalMsgText = data.text || streamedResponse;
                
                // Only post to UI if it's not a temporary status message (like filtered fallback)
                // or if it's the final answer for the user.
                const isStatusMsg = finalMsgText.includes("Sector synchronization complete") || 
                                   finalMsgText.includes("Directive Acknowledged");

                // If it's a following turn, we definitely want the final summary
                // We skip speaking status messages if we know we're in the middle of a multi-tool chain.
                const skipSpeak = isStatusMsg && toolResults.length > 0;

                if (finalMsgText && !skipSpeak) {
                    const finalMsg = { 
                        role: 'agent' as const, 
                        text: finalMsgText, 
                        status: (data.isAlert ? 'alert' : 'monitoring') as any 
                    };
                    addAgentMessage(finalMsg);
                    setAgentStatus(data.isAlert ? 'alert' : 'monitoring');
                    speak(finalMsg.text);
                }
                
                // Update persistent history for the next turn
                conversationHistory.current = [
                    ...conversationHistory.current,
                    { role: 'user', parts: [{ text }] },
                    { role: 'model', parts: [{ text: finalMsgText }] }
                ];
            } else if (data.type === 'error') {
                throw new Error(data.error);
            }
          } catch (e: any) {
              console.warn("[Agent] Stream chunk parsing error:", e.message);
          }
        }
      }

      // 🤖 AUTONOMOUS FOLLOW-UP
      // If the agent initiated tools, it now has the data. 
      // We trigger a recursive call so it can explain that data to the user.
      // 🛡️ RECURSION GUARD: Max depth 2.
      if (toolResults.length > 0 && depth < 2) {
        console.log(`[Agent] Data acquired. Triggering autonomous analysis turn (Depth ${depth + 1})...`);
        const summaryPrompt = `SYSTEM_AUTO_FOLLOWUP: The analysis tools returned: ${JSON.stringify(toolResults)}. If you still need more data to fulfill the user's explicit request, call the necessary tool now. Otherwise, provide a clear, friendly summary of these findings to the user. Be specific about numbers/intensities.`;
        await sendMessage(summaryPrompt, undefined, depth + 1);
      }

    } catch (err: any) {
      console.error("[Agent] Fatal Error:", err);
      setAgentError(err.message);
      addAgentMessage({ 
        role: 'agent', 
        text: `COMMUNICATIONS OFFLINE: ${err.message}.`, 
        status: 'alert' 
      });
      setAgentStatus('idle');
    } finally {
      // Only release processing flag if we aren't about to do an autonomous follow-up
      if (toolResults.length === 0 || depth >= 2) {
        setIsAgentProcessing(false);
      }
    }
  }, [addAgentMessage, heatGuardianMode, userLocation, setAgentStatus, setIsAgentProcessing, setAgentError, speak, activeModel]);

  return {
    sendMessage,
    isProcessing: isAgentProcessing,
    agentStatus,
    agentMessages,
    clearMessages,
    error: agentError
  };
}
