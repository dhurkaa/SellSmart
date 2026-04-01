type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-7xl items-center justify-center">
        <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl md:p-10">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
              SellSmartAI
            </div>

            <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}