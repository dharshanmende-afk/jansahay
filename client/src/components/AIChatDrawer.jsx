import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, Bot, Sparkles, CheckCircle, ExternalLink,
  AlertCircle, RotateCcw, Trash2, ThumbsUp, ThumbsDown, Flag, Info
} from 'lucide-react';
import { aiService } from '../services/api';
import { searchKnowledgeBase, POPULAR_PROMPT_PILLS } from '../services/aiKnowledgeBase';

// Safe URL validator: strictly permits only http:// and https://
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Safe React Markdown Renderer (Zero XSS vulnerability, no dangerouslySetInnerHTML)
function SafeMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  const parseInline = (line) => {
    const parts = [];
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
        const splitIdx = token.indexOf('](');
        const label = token.substring(1, splitIdx);
        const rawUrl = token.substring(splitIdx + 2, token.length - 1);
        if (isSafeUrl(rawUrl)) {
          parts.push(
            <a
              key={match.index}
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1e3a8a', fontWeight: 700, textDecoration: 'underline' }}>
              {label} ↗
            </a>
          );
        } else {
          parts.push(label);
        }
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.6, fontSize: '0.85rem' }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} style={{ height: '0.35rem' }} />;
        }
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: '0.4rem', paddingLeft: '0.5rem' }}>
              <span style={{ color: '#f97316', fontWeight: 800 }}>•</span>
              <div style={{ flex: 1 }}>{parseInline(trimmed.substring(2))}</div>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          return (
            <div key={i} style={{ display: 'flex', gap: '0.4rem', paddingLeft: '0.5rem' }}>
              <span style={{ color: '#1e3a8a', fontWeight: 800, minWidth: '16px' }}>{numMatch[1]}.</span>
              <div style={{ flex: 1 }}>{parseInline(numMatch[2])}</div>
            </div>
          );
        }
        return <div key={i}>{parseInline(line)}</div>;
      })}
    </div>
  );
}

export const AIChatDrawer = ({ currentScheme = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScheme, setActiveScheme] = useState(currentScheme);
  const [language, setLanguage] = useState('en');
  const [sessionId, setSessionId] = useState(() => `sess-${Date.now()}`);
  const [limitedMode, setLimitedMode] = useState(false);
  const [statusChip, setStatusChip] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [ratings, setRatings] = useState({});
  const [reportingMsgIdx, setReportingMsgIdx] = useState(null);
  const [reportText, setReportText] = useState('');
  const [reportNotice, setReportNotice] = useState('');

  const getInitialGreeting = (lang) => {
    if (lang === 'mr') {
      return `**नमस्ते! जनसहाय AI सहाय्यकामध्ये आपले स्वागत आहे!**\n\nमी तुम्हाला **पडताळलेल्या सरकारी योजना**, **पात्रता तपासणी**, आणि **अधिकृत कागदपत्र प्रक्रिया** याबद्दल सोप्या भाषेत मदत करू शकतो.\n\nतुमची माहिती उदा. *"मी साताऱ्याचा शेतकरी आहे, २ एकर जमीन, उत्पन्न ८०,०००"* अशी लिहा किंवा खालील पर्याय निवडा.`;
    }
    if (lang === 'hi') {
      return `**नमस्ते! जनसहाय AI सहायक में आपका स्वागत है!**\n\nमैं आपको **सत्यापित सरकारी योजनाओं**, **पात्रता जांच**, और **दस्तावेज़ प्रक्रिया** के बारे में आसान भाषा में मदद कर सकता हूँ।\n\nअपनी जानकारी लिखें जैसे *"मैं महाराष्ट्र का किसान हूँ, आय 80,000"* या नीचे दिए गए विकल्प चुनें।`;
    }
    return `**Namaste! Welcome to JanSahay AI Assistant!**\n\nI can search **verified government schemes**, run the **deterministic eligibility engine** on your details, and generate **document checklists**.\n\nTry telling me about yourself (e.g., *"Farmer in Satara, 2 acres, income 80,000"*) or pick a topic below!`;
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: getInitialGreeting('en'),
      provider: 'JanSahay Dynamic Agent',
      sources: [],
      matchedSchemes: [],
      suggestedActions: ['Explain simpler', 'Give me a checklist']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentScheme) setActiveScheme(currentScheme);
  }, [currentScheme]);

  useEffect(() => {
    const handleGlobalAskAI = (event) => {
      const detail = event.detail || {};
      if (detail.scheme) setActiveScheme(detail.scheme);
      setIsOpen(true);
      if (detail.initialQuestion) {
        handleSend(detail.initialQuestion, detail.scheme || activeScheme);
      }
    };
    window.addEventListener('jansahay-open-ai', handleGlobalAskAI);
    return () => window.removeEventListener('jansahay-open-ai', handleGlobalAskAI);
  }, [activeScheme]);

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText, statusChip, isOpen]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (messages.length <= 1) {
      setMessages([
        {
          role: 'assistant',
          text: getInitialGreeting(newLang),
          provider: 'JanSahay Dynamic Agent',
          sources: [],
          matchedSchemes: []
        }
      ]);
    }
  };

  const detectLanguage = (text) => {
    if (!text) return language;
    if (/[\u0900-\u097F]/.test(text)) {
      if (/आहे|सांगा|कसा|माहिती|योजना|दाखला|हक्क|काढू/.test(text)) return 'mr';
      return 'hi';
    }
    return language;
  };

  const schemeName = activeScheme?.schemeName || activeScheme?.name;
  const suggestionPills = activeScheme ? [
    { label: `Explain ${schemeName?.split(' ')[0]} simpler`, query: `Explain ${schemeName} in simple words`, mode: 'simpler' },
    { label: `Checklist for ${schemeName?.split(' ')[0]}`, query: `Give me a document checklist for ${schemeName}`, mode: 'checklist' },
    { label: 'Am I eligible?', query: `Check my eligibility for ${schemeName}` }
  ] : POPULAR_PROMPT_PILLS;

  const handleSend = async (textToSend, overrideScheme = null, mode = 'default') => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStatusChip('Connecting to JanSahay AI...');
    setStreamingText('');
    setLastFailedQuestion(null);

    const schemeToUse = overrideScheme || activeScheme;
    const effectiveLang = detectLanguage(question);

    try {
      let accumulated = '';
      const payload = await aiService.chatStream(
        {
          question,
          schemeId: schemeToUse?.id || schemeToUse?.schemeId || null,
          language: effectiveLang,
          sessionId,
          mode
        },
        (evtName, evtData) => {
          if (evtName === 'status' && evtData?.message) {
            setStatusChip(evtData.message);
          } else if (evtName === 'tool' && evtData?.toolName) {
            setStatusChip(`Verified via ${evtData.toolName} (${evtData.durationMs}ms)`);
          } else if (evtName === 'chunk' && evtData?.text) {
            accumulated += evtData.text;
            setStreamingText(accumulated);
          }
        }
      );

      if (payload && payload.answer) {
        if (payload.sessionId) setSessionId(payload.sessionId);
        if (typeof payload.limitedMode === 'boolean') setLimitedMode(payload.limitedMode);

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: payload.answer,
            questionAsked: question,
            messageId: payload.messageId,
            provider: payload.provider || 'JanSahay Dynamic Agent',
            limitedMode: payload.limitedMode,
            sources: payload.sources || [],
            matchedSchemes: payload.matchedSchemes || [],
            suggestedActions: payload.suggestedActions || ['Explain simpler', 'Give me a checklist'],
            toolCalls: payload.toolCalls || [],
            officialUrl: payload.officialUrl,
            isVerified: payload.isVerified
          }
        ]);
        return;
      }

      // Non-streaming fallback if stream yielded empty payload
      const res = await aiService.chat({
        question,
        schemeId: schemeToUse?.id || schemeToUse?.schemeId || null,
        language: effectiveLang,
        sessionId,
        mode
      });
      if (res?.success && res?.data) {
        setLimitedMode(Boolean(res.data.limitedMode));
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.answer,
            questionAsked: question,
            messageId: res.data.messageId,
            provider: res.data.provider,
            limitedMode: res.data.limitedMode,
            sources: res.data.sources || [],
            matchedSchemes: res.data.matchedSchemes || [],
            suggestedActions: res.data.suggestedActions || [],
            officialUrl: res.data.officialUrl
          }
        ]);
        return;
      }
      throw new Error('Empty response from server');
    } catch (err) {
      console.warn('[AI] Stream/API fallback triggered:', err.message || err);
      const fallbackAnswer = searchKnowledgeBase(question, schemeToUse, effectiveLang);
      if (fallbackAnswer) {
        setLimitedMode(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: fallbackAnswer,
            questionAsked: question,
            provider: 'JanSahay Offline Grounded KB (Limited Mode)',
            limitedMode: true,
            sources: []
          }
        ]);
      } else {
        setLastFailedQuestion(question);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `**Unable to reach JanSahay server right now.**\n\nPlease check your connection or click **Retry** below.`,
            provider: 'System Notice',
            isError: true
          }
        ]);
      }
    } finally {
      setLoading(false);
      setStatusChip('');
      setStreamingText('');
    }
  };

  const handleRate = async (msgIdx, msg, rating) => {
    setRatings(prev => ({ ...prev, [msgIdx]: rating }));
    try {
      await aiService.sendFeedback({
        sessionId,
        messageId: msg.messageId || msgIdx,
        rating,
        question: msg.questionAsked || ''
      });
    } catch {
      // keep optimistic UI rating state
    }
  };

  const handleReportSubmit = async (e, msg) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    try {
      await aiService.submitCorrection({
        schemeId: msg?.matchedSchemes?.[0]?.id || null,
        feedbackType: 'ERROR_REPORT',
        comment: `AI Response Report: ${reportText.trim()}`
      });
      setReportNotice('Thank you! Correction submitted for admin review.');
      setReportingMsgIdx(null);
      setReportText('');
      setTimeout(() => setReportNotice(''), 3500);
    } catch {
      setReportNotice('Could not submit report right now.');
    }
  };

  const handleClearChat = () => {
    setSessionId(`sess-${Date.now()}`);
    setMessages([
      {
        role: 'assistant',
        text: getInitialGreeting(language),
        provider: 'JanSahay Dynamic Agent',
        sources: [],
        matchedSchemes: []
      }
    ]);
    setLastFailedQuestion(null);
    setRatings({});
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-drawer no-print"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f2459 100%)',
            color: 'white',
            border: '2px solid #f97316',
            borderRadius: '9999px',
            padding: '0.85rem 1.35rem',
            boxShadow: '0 10px 25px -5px rgba(30,58,138,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            zIndex: 999,
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
          <Sparkles size={18} color="#f97316" />
          <span>Ask JanSahay AI</span>
        </button>
      )}

      {isOpen && (
        <div
          className="chat-drawer no-print"
          role="dialog"
          aria-label="JanSahay AI Assistant"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '470px',
            maxWidth: '94vw',
            height: '670px',
            maxHeight: '90vh',
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 20px 30px -10px rgba(15,23,42,0.3)',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            overflow: 'hidden'
          }}>

          {/* Header */}
          <div style={{ padding: '0.85rem 1rem', backgroundColor: '#1e3a8a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={20} color="white" />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  JanSahay AI Assistant
                </h3>
                <span style={{ fontSize: '0.68rem', color: '#93c5fd', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeScheme ? `Context: ${schemeName}` : 'Tool-Grounded Eligibility & Scheme Agent'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.18)', borderRadius: '6px', padding: '2px' }}>
                {[
                  { code: 'en', label: 'EN' },
                  { code: 'mr', label: 'मराठी' },
                  { code: 'hi', label: 'हिंदी' }
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    style={{
                      background: language === l.code ? '#f97316' : 'transparent',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClearChat}
                title="Clear Chat Conversation" aria-label="Clear chat conversation"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '5px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat Drawer" aria-label="Close chat assistant"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '9999px', width: '26px', height: '26px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Mandatory AI Guidance Disclaimer */}
          <div style={{
            padding: '0.35rem 0.75rem',
            backgroundColor: '#eff6ff',
            borderBottom: '1px solid #bfdbfe',
            fontSize: '0.7rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Info size={12} />
            <span>AI guidance only; confirm eligibility, fees &amp; deadlines on the official portal.</span>
          </div>

          {/* Limited Mode Banner */}
          {limitedMode && (
            <div style={{
              padding: '0.35rem 0.75rem',
              backgroundColor: '#fef3c7',
              borderBottom: '1px solid #fde68a',
              fontSize: '0.7rem',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <AlertCircle size={12} />
              <span>Limited mode: Deterministic verified engine active (external LLM key unavailable or rate-limited).</span>
            </div>
          )}

          {reportNotice && (
            <div style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.72rem', fontWeight: 600 }}>
              {reportNotice}
            </div>
          )}

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '94%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '0.75rem',
                  backgroundColor: m.role === 'user' ? '#1e3a8a' : '#ffffff',
                  color: m.role === 'user' ? '#ffffff' : '#1e293b',
                  border: m.role === 'user' ? 'none' : m.isError ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {m.role === 'user' ? (
                    <div style={{ fontSize: '0.85rem' }}>{m.text}</div>
                  ) : (
                    <>
                      <SafeMarkdown text={m.text} />

                      {/* Inline Verified Scheme Cards */}
                      {Array.isArray(m.matchedSchemes) && m.matchedSchemes.length > 0 && (
                        <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {m.matchedSchemes.slice(0, 3).map((sc) => (
                            <div
                              key={sc.id || sc.name}
                              style={{
                                border: '1px solid #cbd5e1',
                                borderLeft: '3px solid #1e3a8a',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 0.65rem',
                                backgroundColor: '#f8fafc',
                                fontSize: '0.75rem'
                              }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                                <strong style={{ color: '#0f172a' }}>{sc.name}</strong>
                                {sc.matchType && (
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: '#dbeafe', color: '#1e40af' }}>
                                    {sc.matchType} ({sc.matchScore}%)
                                  </span>
                                )}
                              </div>
                              {sc.benefit && <div style={{ color: '#475569', marginTop: '0.2rem' }}>{sc.benefit}</div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem', fontSize: '0.68rem', color: '#64748b' }}>
                                <span>Verified: {sc.lastVerifiedAt || 'Official Record'}</span>
                                {sc.sourceUrl && isSafeUrl(sc.sourceUrl) && (
                                  <a href={sc.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#1e3a8a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    Official Portal <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Chips (Explain simpler / Give me a checklist) */}
                      {idx === messages.length - 1 && m.questionAsked && !loading && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
                          <button
                            type="button"
                            onClick={() => handleSend(`Explain simpler: ${m.questionAsked}`, null, 'simpler')}
                            style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#1e3a8a', fontWeight: 600, cursor: 'pointer' }}>
                            Explain simpler
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSend(`Give me a checklist: ${m.questionAsked}`, null, 'checklist')}
                            style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#1e3a8a', fontWeight: 600, cursor: 'pointer' }}>
                            Give me a checklist
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Provider & Evaluation Controls (Thumbs up/down + Report wrong info) */}
                {m.role === 'assistant' && m.provider && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '94%', marginTop: '0.25rem', fontSize: '0.65rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle size={10} color="#15803d" />
                      <span>{m.provider}</span>
                    </div>
                    {idx > 0 && !m.isError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          aria-label="Thumbs up"
                          onClick={() => handleRate(idx, m, 'up')}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: ratings[idx] === 'up' ? '#15803d' : '#64748b', padding: '2px' }}>
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          type="button"
                          aria-label="Thumbs down"
                          onClick={() => handleRate(idx, m, 'down')}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: ratings[idx] === 'down' ? '#dc2626' : '#64748b', padding: '2px' }}>
                          <ThumbsDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportingMsgIdx(reportingMsgIdx === idx ? null : idx)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <Flag size={10} /> Report wrong information
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {reportingMsgIdx === idx && (
                  <form onSubmit={(e) => handleReportSubmit(e, m)} style={{ width: '94%', marginTop: '0.35rem', display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Describe incorrect fee, date, or rule..."
                      style={{ flex: 1, fontSize: '0.72rem', padding: '0.3rem 0.5rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1' }}
                    />
                    <button type="submit" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.35rem', cursor: 'pointer' }}>
                      Send
                    </button>
                  </form>
                )}
              </div>
            ))}

            {/* Live SSE Streaming Preview + Status Chip */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignSelf: 'flex-start', maxWidth: '94%' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#1e3a8a', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.7rem', background: '#eff6ff', borderRadius: '9999px', border: '1px solid #bfdbfe', alignSelf: 'flex-start' }}>
                  <Sparkles size={13} color="#1e3a8a" className="animate-spin" />
                  <span>{statusChip || 'Searching schemes...'}</span>
                </div>
                {streamingText && (
                  <div style={{ padding: '0.7rem 0.9rem', background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <SafeMarkdown text={streamingText} />
                  </div>
                )}
              </div>
            )}

            {lastFailedQuestion && !loading && (
              <div style={{ alignSelf: 'center', marginTop: '0.25rem' }}>
                <button
                  onClick={() => handleSend(lastFailedQuestion)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}>
                  <RotateCcw size={12} /> Retry Question
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Clickable Question Pills */}
          <div style={{
            padding: '0.4rem 0.6rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {suggestionPills.map((pill, idx) => {
              const label = typeof pill === 'string' ? pill : pill.label;
              const query = typeof pill === 'string' ? pill : pill.query;
              const pillMode = typeof pill === 'object' && pill.mode ? pill.mode : 'default';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(query, null, pillMode)}
                  disabled={loading}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '9999px',
                    padding: '0.3rem 0.7rem',
                    fontSize: '0.72rem',
                    color: '#334155',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    opacity: loading ? 0.6 : 1
                  }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ padding: '0.65rem', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in EN / HI / MR or type your profile..."
              disabled={loading}
              maxLength={1000}
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-primary btn-sm"
              style={{ padding: '0 0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
