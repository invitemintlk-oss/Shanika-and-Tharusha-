import React, { useEffect, useState } from 'react';
import { Copy, Link as LinkIcon, CheckCircle, MessageCircle } from 'lucide-react';
import {
  WEDDING,
  PREFIXES,
  Prefix,
  buildDisplayName,
  buildGreeting,
  buildInviteLink,
  buildInviteMessage,
} from './weddingConfig';

const inputClass =
  'w-full px-4 py-3 rounded-lg border border-brand-beige focus:ring-2 focus:ring-brand-beige-deep focus:border-transparent outline-none transition-all bg-white font-sans';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export function AdminPage() {
  const [prefix, setPrefix] = useState<Prefix>('Mr.');
  const [guestName, setGuestName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = buildDisplayName(prefix, guestName);
    if (!name) return;
    setDisplayName(name);
    setGeneratedLink(buildInviteLink(window.location.origin, name));
  };

  // Clear stale output when inputs change after generating
  useEffect(() => {
    if (generatedLink && buildDisplayName(prefix, guestName) !== displayName) {
      setGeneratedLink('');
      setDisplayName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, guestName]);

  const message = generatedLink ? buildInviteMessage(displayName, generatedLink) : '';

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyText(text);
    setToast(ok ? label : 'Copy failed — please copy manually');
  };

  return (
    <div className="min-h-screen bg-brand-ivory py-12 px-4 sm:px-6 lg:px-8 font-sans text-stone-800 flex items-center justify-center">
      {/* Success notification */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-stone-800 text-white text-sm shadow-lg transition-all duration-300 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <CheckCircle className="w-4 h-4 text-green-400" />
        {toast}
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0_8px_30px_rgba(176,137,104,0.15)] overflow-hidden border border-brand-beige/50">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display tracking-wide mb-2 text-stone-800">Invitation Links</h2>
            <p className="text-stone-500 font-sans text-xs uppercase tracking-[0.2em]">
              {WEDDING.groomName} &amp; {WEDDING.brideName} · {WEDDING.dateShort}
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label htmlFor="prefix" className="block text-sm font-medium text-stone-700 mb-1 tracking-wide">
                Select Prefix
              </label>
              <select
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value as Prefix)}
                className={inputClass}
              >
                {PREFIXES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-stone-700 mb-1 tracking-wide">
                Guest Name
              </label>
              <input
                type="text"
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Sanjaya"
                autoComplete="off"
                className={inputClass}
              />
              {guestName.trim() && (
                <p className="mt-2 text-xs text-stone-500">
                  Shown as: <span className="font-semibold text-stone-700">{buildDisplayName(prefix, guestName)}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!guestName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-beige-deep text-white font-sans text-sm tracking-[0.2em] uppercase shadow-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LinkIcon className="w-5 h-5" />
              Generate Link
            </button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="p-4 bg-brand-ivory rounded-xl border border-brand-beige/50">
              <p className="text-xs text-stone-500 mb-2 font-semibold uppercase tracking-[0.15em]">Generated Link</p>
              {generatedLink ? (
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-sm text-brand-beige-deep underline underline-offset-2"
                >
                  {generatedLink}
                </a>
              ) : (
                <p className="text-sm text-stone-400 italic">Enter a guest name and click Generate Link.</p>
              )}
            </div>

            {generatedLink && (
              <div className="p-4 bg-white rounded-xl border border-brand-beige/50">
                <p className="text-xs text-stone-500 mb-2 font-semibold uppercase tracking-[0.15em]">Message Preview</p>
                <p className="font-semibold text-stone-800 mb-2">{buildGreeting(displayName)}</p>
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-stone-600 leading-relaxed max-h-64 overflow-y-auto">
                  {message.split('\n').slice(1).join('\n').trim()}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!generatedLink}
                onClick={() => handleCopy(generatedLink, 'Link copied!')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-brand-beige-deep text-brand-beige-deep text-xs tracking-[0.15em] uppercase hover:bg-brand-beige/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                Copy Link Only
              </button>
              <button
                type="button"
                disabled={!generatedLink}
                onClick={() => handleCopy(message, 'Message copied!')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-stone-800 text-white text-xs tracking-[0.15em] uppercase hover:bg-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4" />
                Copy Full Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
