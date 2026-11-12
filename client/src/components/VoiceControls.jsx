import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';

const SPEECH_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
};

export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isTtsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

/**
 * VoiceMicButton — Web Speech API Speech-to-Text button supporting EN, HI, MR
 * with graceful fallback message when unsupported in a browser/environment.
 */
export const VoiceMicButton = ({ language = 'en', onTranscript, disabled = false }) => {
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRec = getSpeechRecognitionConstructor();

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore cleanup error
      }
    };
  }, []);

  const toggleListen = () => {
    if (!SpeechRec) {
      setNotice('Voice input unavailable in this browser.');
      setTimeout(() => setNotice(''), 3000);
      return;
    }

    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = SPEECH_LOCALE_MAP[language] || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        setNotice('');
      };
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript && typeof onTranscript === 'function') {
          onTranscript(transcript);
        }
      };
      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === 'not-allowed') {
          setNotice('Microphone permission blocked.');
        } else {
          setNotice('Could not hear speech clearly; try again or type.');
        }
        setTimeout(() => setNotice(''), 3000);
      };
      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      setNotice('Voice recognition unavailable right now.');
      setTimeout(() => setNotice(''), 3000);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={toggleListen}
        disabled={disabled}
        aria-label={listening ? 'Stop voice input' : `Speak question in ${language.toUpperCase()}`}
        aria-pressed={listening}
        title={SpeechRec ? `Voice input (${SPEECH_LOCALE_MAP[language] || 'en-IN'})` : 'Voice input unsupported in this browser'}
        style={{
          minWidth: '38px',
          minHeight: '38px',
          borderRadius: '0.5rem',
          border: '1px solid',
          borderColor: listening ? '#dc2626' : '#cbd5e1',
          backgroundColor: listening ? '#fee2e2' : '#f8fafc',
          color: listening ? '#b91c1c' : '#1e3a8a',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: SpeechRec ? 1 : 0.65
        }}>
        {listening ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
      </button>
      {notice && (
        <span
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '115%',
            right: 0,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '0.7rem',
            padding: '0.3rem 0.55rem',
            borderRadius: '0.4rem',
            whiteSpace: 'nowrap',
            zIndex: 50
          }}>
          {notice}
        </span>
      )}
    </div>
  );
};

/**
 * SpeakButton — Web Speech API Text-to-Speech reader for EN, HI, MR content
 */
export const SpeakButton = ({ text = '', language = 'en', label = 'Listen' }) => {
  const [speaking, setSpeaking] = useState(false);
  const supported = isTtsSupported();

  useEffect(() => {
    return () => {
      if (supported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [supported]);

  const handleToggleSpeak = () => {
    if (!supported || !text) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const plainText = String(text)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_`#]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new window.SpeechSynthesisUtterance(plainText.slice(0, 1200));
      const targetLang = SPEECH_LOCALE_MAP[language] || 'en-IN';
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices() || [];
      const matchingVoice = voices.find(v => v.lang?.toLowerCase().startsWith(targetLang.split('-')[0].toLowerCase()));
      if (matchingVoice) utterance.voice = matchingVoice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
    }
  };

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      aria-label={speaking ? 'Stop audio playback' : `Read aloud in ${language.toUpperCase()}`}
      aria-pressed={speaking}
      style={{
        border: '1px solid #cbd5e1',
        backgroundColor: speaking ? '#eff6ff' : '#f8fafc',
        color: '#1e3a8a',
        borderRadius: '999px',
        padding: '2px 8px',
        fontSize: '0.68rem',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        cursor: 'pointer'
      }}>
      {speaking ? <Square size={10} aria-hidden="true" /> : <Volume2 size={11} aria-hidden="true" />}
      <span>{speaking ? 'Stop' : label}</span>
    </button>
  );
};
