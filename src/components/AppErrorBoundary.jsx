import { Sentry } from "../services/errorMonitoring";

const CrashFallback = () => (
  <main className="flex min-h-screen items-center justify-center bg-[#020817] px-6 text-white">
    <section className="w-full max-w-lg rounded-3xl border border-violet-400/20 bg-slate-950/80 p-8 text-center shadow-2xl shadow-violet-950/30">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-2xl">
        ✦
      </div>
      <h1 className="text-2xl font-semibold">OrbitalAI needs a quick refresh</h1>
      <p className="mt-3 text-slate-400">
        The error has been recorded. Refresh the page to continue working.
      </p>
      <button
        className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 font-medium text-white"
        type="button"
        onClick={() => window.location.reload()}
      >
        Refresh OrbitalAI
      </button>
    </section>
  </main>
);

const AppErrorBoundary = ({ children }) => (
  <Sentry.ErrorBoundary fallback={<CrashFallback />} showDialog={false}>
    {children}
  </Sentry.ErrorBoundary>
);

export default AppErrorBoundary;
