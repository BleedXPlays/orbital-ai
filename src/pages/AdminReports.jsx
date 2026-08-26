import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/apiClient";

const statuses = ["new", "reviewing", "resolved", "closed"];
const priorities = ["low", "normal", "high", "urgent"];

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await apiFetch("/api/reports?view=admin");
      const data = await response.json();
      if (response.status === 403) { setDenied(true); return; }
      if (!response.ok) throw new Error(data.error || "Could not load reports.");
      setDenied(false);
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch("/api/reports?view=admin")
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 403) {
          if (active) setDenied(true);
          return;
        }
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

  const filteredReports = useMemo(() => reports.filter((report) => {
    if (statusFilter !== "all" && report.status !== statusFilter) return false;
    const text = `${report.subject} ${report.description} ${report.user_name} ${report.user_email}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  }), [reports, search, statusFilter]);

  const changeReport = (id, field, value) => setReports((current) => current.map((report) => report.id === id ? { ...report, [field]: value } : report));

  const saveReport = async (report) => {
    setSavingId(report.id);
    setMessage("");
    try {
      const response = await apiFetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, status: report.status, priority: report.priority, adminResponse: report.admin_response || "", archived: Boolean(report.archived) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update the report.");
      setReports((current) => current.map((item) => item.id === report.id ? data.report : item));
      setMessage("Report updated successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingId("");
    }
  };

  if (denied) return <div className="orbital-page flex h-full items-center justify-center px-5 text-white"><div className="max-w-md rounded-3xl border border-red-400/20 bg-[#140b18]/85 p-7 text-center"><div className="text-3xl">🔒</div><h1 className="mt-4 text-2xl font-semibold">Access denied</h1><p className="mt-3 text-sm leading-6 text-slate-400">This page is available only to an approved OrbitalAI administrator.</p></div></div>;

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto text-white">
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:py-9 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Private administration</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">User reports</h1><p className="mt-2 text-sm text-slate-400">Review feedback, reply to users, and manage resolution status.</p></div>
          <button onClick={loadReports} className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-200 hover:bg-white/[0.07]">Refresh</button>
        </header>

        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_180px]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, users, or email…" className="rounded-xl border border-white/[0.1] bg-[#091426]/85 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/50" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/[0.1] bg-[#091426] px-4 py-3 text-sm outline-none"><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        </div>

        {message && <p role="status" className="mt-4 rounded-xl border border-blue-300/15 bg-blue-400/[0.07] px-4 py-3 text-sm text-blue-200">{message}</p>}

        {loading ? <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#071426]/70 p-6 text-sm text-slate-400">Loading reports…</div> : filteredReports.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/[0.12] p-8 text-center text-sm text-slate-500">No reports match this view.</div> : (
          <div className="mt-6 space-y-5">
            {filteredReports.map((report) => (
              <article key={report.id} className={`rounded-3xl border bg-[#071426]/82 p-5 shadow-xl backdrop-blur-xl sm:p-6 ${report.archived ? "border-white/[0.06] opacity-65" : "border-blue-200/[0.14]"}`}>
                <div className="flex flex-wrap justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">{String(report.category).replace("_", " ")}</p><h2 className="mt-1 break-words text-xl font-semibold">{report.subject}</h2><p className="mt-2 text-xs text-slate-500">{report.user_name || "OrbitalAI user"} · {report.user_email || "No email"} · {new Date(report.created_at).toLocaleString()}</p></div><span className="h-fit rounded-full border border-white/[0.1] px-3 py-1 text-xs text-slate-400">{report.id.slice(0, 8)}</span></div>
                <p className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-white/[0.06] bg-black/15 p-4 text-sm leading-6 text-slate-300">{report.description}</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-xs font-medium text-slate-400">Status<select value={report.status} onChange={(event) => changeReport(report.id, "status", event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c1729] px-3 py-2.5 text-sm text-white">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="text-xs font-medium text-slate-400">Priority<select value={report.priority} onChange={(event) => changeReport(report.id, "priority", event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c1729] px-3 py-2.5 text-sm text-white">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
                <label className="mt-4 block text-xs font-medium text-slate-400">Response to user<textarea rows={4} maxLength={5000} value={report.admin_response || ""} onChange={(event) => changeReport(report.id, "admin_response", event.target.value)} placeholder="Write a response that the user can see…" className="mt-2 w-full resize-y rounded-xl border border-white/[0.1] bg-[#0c1729] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" /></label>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={Boolean(report.archived)} onChange={(event) => changeReport(report.id, "archived", event.target.checked)} className="accent-violet-500" /> Archive report</label><button onClick={() => saveReport(report)} disabled={savingId === report.id} className="rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-500/25 disabled:opacity-50">{savingId === report.id ? "Saving…" : "Save changes"}</button></div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReports;
