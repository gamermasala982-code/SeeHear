import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Play, Square, AlertCircle } from 'lucide-react';

export default function AudioPlayer({ textToSpeak, label, languageCode = 'en' }) {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [status, setStatus] = useState('idle'); // idle | playing | paused | error
  const [errorMsg, setErrorMsg] = useState('');
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices() || [];
      setVoices(available);
      if (available.length > 0 && !selectedVoiceURI) {
        const langPrefix = languageCode === 'hi' ? 'hi' : 'en';
        const match =
          available.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
          available[0];
        if (match) setSelectedVoiceURI(match.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [languageCode]);

  useEffect(() => {
    // Stop active playback when passage or language changes
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setStatus('idle');
    }
  }, [textToSpeak, languageCode]);

  const handlePlay = () => {
    if (!supported || !textToSpeak) return;
    setErrorMsg('');

    const synth = window.speechSynthesis;

    if (status === 'paused') {
      synth.resume();
      setStatus('playing');
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const chosenVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = languageCode === 'hi' ? 'hi-IN' : 'en-US';
    }

    utterance.onstart = () => setStatus('playing');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => {
      setStatus('error');
      setErrorMsg('Browser speech synthesis interrupted or unavailable for the selected voice.');
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const handlePause = () => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  };

  const handleStop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
  };

  return (
    <section
      className="surface-card"
      aria-label="Browser Speech Synthesis Audio Controls"
      style={{ backgroundColor: 'var(--bg-subtle)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
          <Volume2 size={16} aria-hidden="true" />
          <span>Listen with Browser Speech Synthesis</span>
        </div>
        <span className="meta-tag">
          Status: {status === 'idle' ? 'Ready' : status === 'playing' ? 'Speaking' : status === 'paused' ? 'Paused' : 'Error'}
        </span>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Uses your browser’s local Web Speech API (<code>window.speechSynthesis</code>). No remote audio file is generated or stored.
      </p>

      {!supported ? (
        <div className="notice-banner warning" style={{ marginBottom: 0 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Your current browser environment does not support the Web Speech Synthesis API. You can still read all original passages and translations below.
          </span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.8125rem', marginBottom: '0.75rem', padding: '0.5rem 0.625rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong>Active Reading Target:</strong> {label || 'Selected passage'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.625rem' }}>
            {status !== 'playing' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={handlePlay} disabled={!textToSpeak}>
                <Play size={14} aria-hidden="true" />
                <span>{status === 'paused' ? 'Resume' : 'Play Aloud'}</span>
              </button>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={handlePause}>
                <Pause size={14} aria-hidden="true" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleStop}
              disabled={status === 'idle'}
            >
              <Square size={14} aria-hidden="true" />
              <span>Stop</span>
            </button>

            {voices.length > 0 && (
              <select
                aria-label="Select speech synthesis voice"
                className="select-field"
                style={{ width: 'auto', maxWidth: '220px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>

          {errorMsg && (
            <div className="notice-banner error" style={{ marginBottom: 0 }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
