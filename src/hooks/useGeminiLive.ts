import { useState, useEffect, useRef, useCallback } from 'react';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface UseGeminiLiveReturn {
  status: ConnectionStatus;
  isListening: boolean;
  transcript: string;
  response: string;
  functionCalls: FunctionCall[];
  isProcessing: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleListening: () => void;
  captureAndAnalyze: (imageBase64: string) => Promise<void>;
  queryAgent: (userText: string, imageBase64?: string, options?: { silent?: boolean }) => Promise<void>;
  setIsProcessing: (v: boolean) => void;
  error: string | null;
}

export function useGeminiLive(): UseGeminiLiveReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const abortRef = useRef(false);

  const connect = useCallback(async () => {
    setError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input requires Google Chrome or Edge. Please switch browsers.');
      setStatus('error');
      return;
    }

    setStatus('connecting');

    try {
      const testRes = await fetch('/api/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'System check. Reply: ONLINE' }),
      });

      // SSE: read the first event
      const reader = testRes.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        const text = new TextDecoder().decode(value);
        const dataLine = text.split('\n').find(l => l.startsWith('data:'));
        if (dataLine) {
          const parsed = JSON.parse(dataLine.replace('data: ', ''));
          if (parsed.type === 'error') {
            setError(`Agent Error: ${parsed.error}`);
            setStatus('error');
            return;
          }
        }
        reader.cancel();
      }
    } catch (e: any) {
      setError('Cannot reach the AI server. Check your network connection.');
      setStatus('error');
      return;
    }

    synthRef.current = window.speechSynthesis;
    setStatus('connected');
    console.log('EcoEquity Agent: ONLINE — Vertex AI · Gemini 1.5 Flash');
  }, []);

  const disconnect = useCallback(() => {
    abortRef.current = true;
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    setIsListening(false);
    setStatus('disconnected');
    setTranscript('');
    setResponse('');
    setFunctionCalls([]);
  }, []);

  const queryAgent = useCallback(async (userText: string, imageBase64?: string, options?: { silent?: boolean }) => {
    setResponse('');
    setFunctionCalls([]);
    setTranscript(userText);
    if (!options?.silent) setIsProcessing(true);

    try {
      const res = await fetch('/api/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText, imageBase64 }),
      });

      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.replace('data: ', ''));

            if (data.type === 'error') {
              setResponse(`⚠️ ${data.error}`);
            } else if (data.type === 'response') {
              if (!response) console.log(`[EcoEquity] Intelligence Active — Engine: ${data.model || 'Gemini 1.5'}`);
              setResponse(data.text || '');
              if (data.functionCalls?.length) {
                setFunctionCalls(data.functionCalls);
              }

              // Speak response
              if (data.text && synthRef.current) {
                synthRef.current.cancel();
                const utterance = new SpeechSynthesisUtterance(data.text);
                utterance.rate = 0.95;
                utterance.lang = 'en-US';

                const voices = synthRef.current.getVoices();
                const natural = voices.find(v =>
                  v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
                );
                if (natural) utterance.voice = natural;
                synthRef.current.speak(utterance);
              }
            }
          } catch (_) {}
        }
      }
    } catch (e: any) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const captureAndAnalyze = useCallback(async (imageBase64: string) => {
    await queryAgent('Analyze this map frame. Identify heat risks, NDVI levels, and any Social Equity Gaps.', imageBase64);
  }, [queryAgent]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    synthRef.current?.cancel();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    abortRef.current = false;

    let finalText = '';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setResponse('');
    };

    recognition.onresult = (event: any) => {
      const interim = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript).join('');
      setTranscript(interim);

      const finals = Array.from(event.results as any[])
        .filter((r: any) => r.isFinal)
        .map((r: any) => r[0].transcript).join('');
      if (finals) finalText = finals;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (abortRef.current) return;
      const text = finalText || transcript;
      if (text.trim()) queryAgent(text);
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions in Chrome.');
      }
    };

    recognition.start();
  }, [queryAgent, transcript]);

  const stopListening = useCallback(() => {
    abortRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  return {
    status,
    isListening,
    transcript,
    response,
    functionCalls,
    isProcessing,
    connect,
    disconnect,
    toggleListening,
    captureAndAnalyze,
    queryAgent,
    setIsProcessing,
    error,
  };
}
