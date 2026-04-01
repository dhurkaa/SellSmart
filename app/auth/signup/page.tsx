'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/auth-shell';
import { createClient } from '@/lib/supabase/client';

type AccountType = 'individual' | 'company';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    accountType: 'individual' as AccountType,
  });

  function validateForm() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form.fullName.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (!emailRegex.test(form.email)) {
      return 'Please enter a valid email address.';
    }

    if (form.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (form.accountType === 'company' && form.companyName.trim().length < 2) {
      return 'Company name is required for company accounts.';
    }

    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          account_type: form.accountType,
          company_name: form.accountType === 'company' ? form.companyName : null,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('Account created successfully. You can now sign in.');
    setLoading(false);

    setTimeout(() => {
      router.push('/auth/login');
    }, 1200);
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Choose whether you want to use SellSmartAI as an individual or as a company."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Full name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
            placeholder="Your full name"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Account type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, accountType: 'individual' }))
              }
              className={
                form.accountType === 'individual'
                  ? 'rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700'
                  : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700'
              }
            >
              Individual
            </button>

            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, accountType: 'company' }))
              }
              className={
                form.accountType === 'company'
                  ? 'rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700'
                  : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700'
              }
            >
              Company
            </button>
          </div>
        </div>

        {form.accountType === 'company' && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Company name
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, companyName: e.target.value }))
              }
              placeholder="Your company"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              required={form.accountType === 'company'}
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="you@company.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Create password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_55%,#0ea5e9_100%)] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="pt-2 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}