'use client';

import { useRef, useState } from 'react';

/**
 * Shared voice-input logic.
 * - Streams interim transcript via onTranscript callback
 * - Auto-stops after 3 seconds of silence
 * - Calls onDone(finalText) when recognition ends with text
 */
export function useVoiceInput(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const onDoneRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  function start(onDone) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    onDoneRef.current = onDone;
    transcriptRef.current = '';

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      clearTimeout(silenceTimerRef.current);
      const text = transcriptRef.current.trim();
      if (text) onDoneRef.current?.(text);
    };
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      transcriptRef.current = transcript;
      onTranscriptRef.current?.(transcript);
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognitionRef.current?.stop(), 3000);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      clearTimeout(silenceTimerRef.current);
    };
    recognition.start();
  }

  function toggle(onDone) {
    if (isRecording) recognitionRef.current?.stop();
    else start(onDone);
  }

  return { isRecording, toggle };
}
