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
          userPhotoUrl: user?.photoURL || user?.providerData?.find((provider) => provider.providerId === "google.com")?.photoURL || "",
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
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:py-9 lg:px-8">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Support center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Report a problem</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Send a bug report, complaint, or feature request. You can follow its status and read the administrator’s response here.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={submitReport} className="h-fit rounded-3xl border border-blue-200/[0.15] bg-[#071426]/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <label className="block text-sm font-medium text-slate-200">Category</label>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c1729] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50">
              {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>

            <label className="mt-5 block text-sm font-medium text-slate-200">Subject</label>
            <input value={form.subject} maxLength={120} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Briefly explain the issue" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c1729] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" />

            <label className="mt-5 block text-sm font-medium text-slate-200">Description</label>
            <textarea value={form.description} maxLength={5000} rows={7} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What happened, and what did you expect?" className="mt-2 w-full resize-y rounded-xl border border-white/[0.1] bg-[#0c1729] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" />
            <div className="mt-2 text-right text-xs text-slate-600">{form.description.length}/5000</div>

            {message && <p role="status" className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${message.includes("successfully") ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>{message}</p>}

            <button disabled={submitting} className="mt-5 w-full rounded-xl border border-violet-400/30 bg-gradient-to-r from-blue-600/80 to-violet-600/80 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </form>

          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-xl font-semibold">My reports</h2><p className="mt-1 text-sm text-slate-500">Only you and an administrator can view these reports.</p></div>
              <button type="button" onClick={loadReports} className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]">Refresh</button>
            </div>

            {loading ? <div className="rounded-2xl border border-white/[0.08] bg-[#071426]/70 p-6 text-sm text-slate-400">Loading reports…</div> : reports.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#071426]/55 p-8 text-center text-sm text-slate-500">You have not submitted any reports yet.</div> : (
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
