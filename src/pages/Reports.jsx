import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient";

const categoryLabels = {
  bug: "Bug",
  complaint: "Complaint",
  feature_request: "Feature request",
  other: "Other",
};

const statusClasses = {
  new: "border-blue-300/25 bg-blue-400/10 text-blue-200",
  reviewing: "border-amber-300/25 bg-amber-400/10 text-amber-200",
  resolved: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
  closed: "border-slate-300/20 bg-slate-400/10 text-slate-300",
};

function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ category: "bug", subject: "", description: "" });
  const userPhotoUrl = user?.photoURL || user?.providerData?.find((provider) => provider.providerId === "google.com")?.photoURL || "";

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/reports?view=mine");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load reports.");
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch("/api/reports?view=mine")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load reports.");
        if (active) setReports(Array.isArray(data.reports) ? data.reports : []);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userPhotoUrl) return;
    apiFetch("/api/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPhotoUrl }),
    }).catch(() => {
      // Profile-photo synchronization is non-critical; report loading still works.
    });
  }, [userPhotoUrl]);

  const submitReport = async (event) => {
    event.preventDefault();
    setMessage("");
    if (form.subject.trim().length < 3 || form.description.trim().length < 10) {
      setMessage("Add a subject and at least 10 characters describing the issue.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userName: user?.displayName || "",
          userPhotoUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit the report.");
      setReports((current) => [data.report, ...current].filter(Boolean));
      setForm({ category: "bug", subject: "", description: "" });
      setMessage("Your report was submitted successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto text-white">
      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-20 sm:px-6 sm:py-12 lg:px-8">
        <header className="mx-auto mb-8 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300"><span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />Support center</span>
          <h1 className="mt-4 bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-3xl font-semibold tracking-[-0.04em] text-transparent sm:text-4xl">Report a problem</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Tell us what happened. Your report stays private between you and the OrbitalAI administration team.</p>
        </header>

        <div className="mx-auto max-w-2xl">
          <form onSubmit={submitReport} className="relative overflow-hidden rounded-[28px] border border-blue-200/[0.18] bg-[#071426]/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4),0_0_45px_rgba(66,119,255,0.07)] backdrop-blur-2xl sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
            <div className="mb-6 flex items-center gap-3 border-b border-white/[0.07] pb-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-400/10 text-lg">✦</span><div><h2 className="font-semibold text-slate-100">How can we help?</h2><p className="mt-0.5 text-xs text-slate-500">Complete the details below and we’ll review your report.</p></div></div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-200">Category
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2.5 w-full rounded-xl border border-white/[0.1] bg-[#0b172a]/95 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10">
                  {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-200">Subject
                <input value={form.subject} maxLength={120} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Briefly explain the issue" className="mt-2.5 w-full rounded-xl border border-white/[0.1] bg-[#0b172a]/95 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10" />
              </label>
            </div>

            <label className="mt-5 block text-sm font-medium text-slate-200">Description
              <textarea value={form.description} maxLength={5000} rows={6} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What happened, and what did you expect?" className="mt-2.5 w-full resize-y rounded-xl border border-white/[0.1] bg-[#0b172a]/95 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10" />
            </label>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600"><span>Your report is private.</span><span>{form.description.length}/5000</span></div>

            {message && <p role="status" className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${message.includes("successfully") ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>{message}</p>}

            <button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(100,75,255,0.22)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit report"}<span aria-hidden="true">→</span>
            </button>
          </form>

          <section className="mt-9 min-w-0">
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Report history</p><h2 className="mt-1 text-xl font-semibold">My reports</h2><p className="mt-1 text-sm text-slate-500">Track progress and read administrator responses.</p></div>
              <button type="button" onClick={loadReports} className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-xs text-slate-300 transition hover:border-blue-300/20 hover:bg-white/[0.06]">Refresh</button>
            </div>

            {loading ? <div className="rounded-2xl border border-white/[0.08] bg-[#071426]/70 p-6 text-center text-sm text-slate-400 backdrop-blur-xl">Loading reports…</div> : reports.length === 0 ? <div className="rounded-2xl border border-dashed border-blue-200/[0.14] bg-[#071426]/55 p-8 text-center backdrop-blur-xl"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-500">✓</div><p className="mt-3 text-sm font-medium text-slate-400">No reports yet</p><p className="mt-1 text-xs text-slate-600">Reports you submit will appear here.</p></div> : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <article key={report.id} className="rounded-2xl border border-white/[0.09] bg-[#081426]/78 p-4 backdrop-blur-xl sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">{categoryLabels[report.category] || report.category}</p><h3 className="mt-1 break-words font-semibold text-slate-100">{report.subject}</h3></div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClasses[report.status] || statusClasses.new}`}>{report.status}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">{report.description}</p>
                    <p className="mt-3 text-xs text-slate-600">Submitted {new Date(report.created_at).toLocaleString()}</p>
                    {report.admin_response && <div className="mt-4 rounded-xl border border-emerald-300/[0.15] bg-emerald-400/[0.06] p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Administrator response</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{report.admin_response}</p></div>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Reports;
