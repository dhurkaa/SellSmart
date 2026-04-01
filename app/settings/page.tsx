import DashboardShell from '@/components/layout/dashboard-shell';

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900">
          Settings
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          This page will hold company rules, target margins, AI pricing goals, accounting
          preferences, and future integrations.
        </p>
      </div>
    </DashboardShell>
  );
}