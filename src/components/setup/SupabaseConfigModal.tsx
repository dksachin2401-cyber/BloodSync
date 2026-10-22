import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, ShieldCheck, Server } from 'lucide-react';
import { getSupabaseConfigStatus } from '../../services/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const status = getSupabaseConfigStatus();

  if (!isOpen) return null;

  const copySqlPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20261021_bloodsync_schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Database & Backend Architecture
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Supabase PostgreSQL, RLS Policies & Express REST Server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm text-neutral-700 dark:text-neutral-300">
          {/* Current Status Indicator */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Active Runtime Connection:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  status.isConfigured
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                {status.isConfigured ? 'Live Supabase Connected' : 'Active Demo Mode (In-Memory REST Store)'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {status.statusText}. In Demo Mode, all multi-portal workflows (emergencies, donor pledges,
              inventory atomic reservations, notifications, AI demand prediction) run live in real-time
              through our full-stack Express API!
            </p>
          </div>

          {/* How to Connect Supabase */}
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              Steps to Connect Your Production Supabase Project:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              <li>
                Create a project at <span className="font-semibold text-neutral-800 dark:text-neutral-200">supabase.com</span>.
              </li>
              <li>
                Run the bundled SQL migration script in your Supabase SQL Editor.
              </li>
              <li>
                Set the following environment variables in your environment or <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">.env</code> file:
              </li>
            </ol>
            <div className="mt-3 p-3 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto">
              <div>VITE_SUPABASE_URL="https://xyzcompany.supabase.co"</div>
              <div>VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."</div>
              <div>SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # (Server-side only)</div>
            </div>
          </div>

          {/* Bundled Migration File */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Bundled Schema Migration with Row Level Security (RLS)
              </div>
              <button
                onClick={copySqlPath}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Path Copied!' : 'Copy File Path'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Located at: <code className="font-mono text-red-600 dark:text-red-400">supabase/migrations/20261021_bloodsync_schema.sql</code>
              <br />
              Includes 11 tables, enum definitions, foreign keys, indexes, and full RLS policies protecting patient privacy.
            </p>
          </div>

          {/* Security Guarantee */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 pt-4">
            🔒 <strong className="text-neutral-700 dark:text-neutral-300">HIPAA & Privacy Safeguard:</strong> Donor exact home addresses and contact numbers are masked across public endpoints. Only authenticated hospital doctors handling an active accepted pledge receive encrypted direct contact details.
          </div>
        </div>
      </div>
    </div>
  );
};
