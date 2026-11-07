import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, X, Send, Bot, User, Sparkles, CheckCircle,
  ExternalLink, Zap, Globe, AlertCircle, RotateCcw, Trash2
} from 'lucide-react';
import { aiService } from '../services/api';
import { searchKnowledgeBase, POPULAR_PROMPT_PILLS } from '../services/aiKnowledgeBase';

// Safe URL validator: strictly permits only http:// and https://
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Safe React Markdown Renderer (Zero XSS vulnerability, no dangerouslySetInnerHTML)
function SafeMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  // Helper to parse bold **text** and links [label](url) into React elements
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
  const [language, setLanguage] = useState('en'); // 'en' | 'mr' | 'hi'

  const getInitialGreeting = (lang) => {
    if (lang === 'mr') {
      return `**नमस्ते! जनसहाय AI सहाय्यकामध्ये आपले स्वागत आहे!** 🙏\n\nमी केंद्र व राज्य शासनाच्या **४०+ योजना**, लोकसेवा हक्क कायदा २०१५ अंतर्गत **दाखले काढण्याचे नियम**, पात्रता अटी आणि अधिकृत अर्जांबद्दलच्या सर्व लहान-मोठ्या प्रश्नांची अचूक उत्तरे देण्यासाठी प्रशिक्षित आहे.\n\nखालीलपैकी कोणताही प्रश्न निवडा किंवा तुमचा प्रश्न टाईप करा!`;
    }
    if (lang === 'hi') {
      return `**नमस्ते! जनसहाय AI सहायक में आपका स्वागत है!** 🙏\n\nमैं केंद्र व राज्य सरकार की **40+ योजनाओं**, **सरकारी प्रमाणपत्र प्रक्रियाओं**, पात्रता नियमों और आधिकारिक आवेदन संबंधी सभी छोटे-बड़े प्रश्नों के उत्तर देने हेतु प्रशिक्षित हूँ।\n\nनीचे दिए गए किसी भी विषय पर क्लिक करें या अपना प्रश्न लिखें!`;
    }
    return `**Namaste! Welcome to JanSahay AI Assistant!** 🙏\n\nI am trained to answer all small and big questions about **40+ Central & State government schemes**, **statutory certificate procedures** (RTS Act 2015), eligibility calculations, and official application portals.\n\nClick any topic below or type your question in English, Marathi, or Hindi!`;
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: getInitialGreeting('en'),
      provider: 'JanSahay Grounded Engine',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentScheme) {
      setActiveScheme(currentScheme);
    }
  }, [currentScheme]);

  // Global event listener for any "Ask AI About This Scheme" button across the application
  useEffect(() => {
    const handleGlobalAskAI = (event) => {
      const detail = event.detail || {};
      if (detail.scheme) {
        setActiveScheme(detail.scheme);
      }
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
  }, [messages, loading, isOpen]);

  // Handle switching language
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (messages.length <= 1) {
      setMessages([
        {
          role: 'assistant',
          text: getInitialGreeting(newLang),
          provider: 'JanSahay Grounded Engine',
          sources: []
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

  // Suggestions: scheme-specific or curated popular pills
  const schemeName = activeScheme?.schemeName || activeScheme?.name;
  const suggestionPills = activeScheme ? [
    { label: `Explain ${schemeName?.split(' ')[0]} in simple words`, query: `Explain ${schemeName} in simple words and how it helps me` },
    { label: `Required Documents`, query: `What documents are needed for ${schemeName}?` },
    { label: `Official Application Steps`, query: `How to apply officially on govt portal for ${schemeName}?` }
  ] : POPULAR_PROMPT_PILLS;

  const handleSend = async (textToSend, overrideScheme = null) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLastFailedQuestion(null);

    const schemeToUse = overrideScheme || activeScheme;
    const effectiveLang = detectLanguage(question);

    try {
      // Set a 6.5s timeout race so user gets an instant fallback if Render is cold-starting
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 6500)
      );

      const netPromise = aiService.chat({
        question,
        schemeId: schemeToUse?.id || schemeToUse?.schemeId || null,
        language: effectiveLang
      });

      const res = await Promise.race([netPromise, timeoutPromise]);

      if (res && res.success && res.data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.answer,
            provider: res.data.provider || 'JanSahay Grounded Engine',
            sources: res.data.sources || [],
            dataStatus: res.data.dataStatus,
            officialUrl: res.data.officialUrl
          }
        ]);
        return;
      }
      throw new Error(res?.message || 'Empty response from server');
    } catch (err) {
      console.warn('[AI] Fast fallback triggered:', err.message || err);

      // Check client-side comprehensive knowledge base instantly
      const fallbackAnswer = searchKnowledgeBase(question, schemeToUse, effectiveLang);

      if (fallbackAnswer) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: fallbackAnswer,
            provider: 'JanSahay Grounded Engine',
            sources: ['Official Gazette & RTS Act 2015', 'Verified Government Portals']
          }
        ]);
      } else {
        setLastFailedQuestion(question);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `⚠️ **Unable to process your request at this moment.**\n\nPlease check your internet connection or click **Retry** below.`,
            provider: 'System Notice',
            isError: true
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: getInitialGreeting(language),
        provider: 'JanSahay Grounded Engine',
        sources: []
      }
    ]);
    setLastFailedQuestion(null);
  };

  return (
    <>
      {/* Floating Trigger Button */}
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

      {/* Slide-over Chat Drawer */}
      {isOpen && (
        <div
          className="chat-drawer no-print"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '460px',
            maxWidth: '94vw',
            height: '650px',
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
                  {activeScheme ? `Context: ${schemeName}` : 'Answers all small & big scheme questions'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              {/* Language Selector */}
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

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '92%',
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
                    <SafeMarkdown text={m.text} />
                  )}
                </div>

                {m.provider && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontSize: '0.65rem', color: '#64748b' }}>
                    <CheckCircle size={10} color="#15803d" />
                    <span>{m.provider}</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', padding: '0.5rem 0.8rem', background: '#ffffff', borderRadius: '0.6rem', border: '1px solid #e2e8f0', alignSelf: 'flex-start' }}>
                <Sparkles size={14} color="#1e3a8a" className="animate-spin" />
                <span>Thinking & retrieving official verified data...</span>
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

          {/* Quick Clickable Question Pills (Scrollable) */}
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
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(query)}
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
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.15s ease'
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
              placeholder="Ask any scheme or document question (EN/HI/MR)..."
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
