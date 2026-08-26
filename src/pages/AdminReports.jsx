import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../services/apiClient";

const statuses = ["new", "reviewing", "resolved", "closed"];
const priorities = ["low", "normal", "high", "urgent"];
const statusStyles = {
  new: "bg-blue-400",
  reviewing: "bg-amber-400",
  resolved: "bg-emerald-400",
  closed: "bg-slate-400",
};

const labelize = (value) => String(value || "").replaceAll("_", " ");

function ReporterAvatar({ report }) {
  const [imageFailed, setImageFailed] = useState(false);
  const identity = report.user_name || report.user_email || "OrbitalAI user";
  const initials = identity.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  if (report.user_photo_url && !imageFailed) {
    return <img src={report.user_photo_url} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-11 w-11 shrink-0 rounded-full border border-blue-200/20 object-cover shadow-lg" />;
  }

  return <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-300/25 bg-gradient-to-br from-blue-500/35 to-violet-500/35 text-sm font-semibold text-white shadow-lg">{initials || "OA"}</span>;
}

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState("");
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

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
    if (!filterOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filterOpen]);

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

  const deleteReport = async (report) => {
    if (deleteConfirmId !== report.id) {
      setDeleteConfirmId(report.id);
      return;
    }

    setDeletingId(report.id);
    setMessage("");
    try {
      const response = await apiFetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not delete the report.");
      }
      setReports((current) => current.filter((item) => item.id !== report.id));
      setExpandedId("");
      setDeleteConfirmId("");
      setMessage("Report permanently deleted.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingId("");
    }
  };

  if (denied) return <div className="orbital-page flex h-full items-center justify-center px-5 text-white"><div className="max-w-md rounded-3xl border border-red-400/20 bg-[#140b18]/85 p-7 text-center"><div className="text-3xl">🔒</div><h1 className="mt-4 text-2xl font-semibold">Access denied</h1><p className="mt-3 text-sm leading-6 text-slate-400">This page is available only to an approved OrbitalAI administrator.</p></div></div>;

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto text-white">
      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 sm:px-6 sm:py-12 lg:px-8">
        <header className="mx-auto mb-8 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300"><span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />Private administration</span>
          <h1 className="mt-4 bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-3xl font-semibold tracking-[-0.04em] text-transparent sm:text-4xl">User reports</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Review user feedback, send responses, and manage every report from one secure workspace.</p>
        </header>

        <section className="relative overflow-visible rounded-[28px] border border-blue-200/[0.16] bg-[#071426]/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4),0_0_45px_rgba(66,119,255,0.06)] backdrop-blur-2xl sm:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div><h2 className="text-sm font-semibold text-slate-100">Report inbox</h2><p className="mt-1 text-xs text-slate-500">{filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"} in this view</p></div>
            <button onClick={loadReports} className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-blue-300/20 hover:bg-white/[0.07]">Refresh</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_210px]">
          <div className="relative"><svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, users, or email…" className="w-full rounded-xl border border-white/[0.1] bg-[#091426]/85 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-slate-600 transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10" /></div>
          <div ref={filterRef} className="relative z-30">
            <button type="button" aria-haspopup="listbox" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)} className="flex h-full min-h-12 w-full items-center justify-between rounded-xl border border-white/[0.1] bg-[#091426]/95 px-4 py-3 text-left text-sm text-slate-200 shadow-lg backdrop-blur-xl transition hover:border-blue-300/25 hover:bg-[#0d1a30]">
              <span className="flex items-center gap-2.5"><span className={`h-2 w-2 rounded-full ${statusFilter === "all" ? "bg-violet-400" : statusStyles[statusFilter]}`} />{statusFilter === "all" ? "All statuses" : labelize(statusFilter)}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 text-slate-400 transition ${filterOpen ? "rotate-180" : ""}`}><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
            </button>
            {filterOpen && <div role="listbox" className="absolute right-0 z-40 mt-2 w-full min-w-52 overflow-hidden rounded-2xl border border-blue-200/[0.16] bg-[#0a1528]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              {["all", ...statuses].map((status) => <button key={status} type="button" role="option" aria-selected={statusFilter === status} onClick={() => { setStatusFilter(status); setFilterOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${statusFilter === status ? "bg-violet-500/15 text-violet-100" : "text-slate-300 hover:bg-white/[0.06]"}`}><span className="flex items-center gap-2.5"><span className={`h-2 w-2 rounded-full ${status === "all" ? "bg-violet-400" : statusStyles[status]}`} />{status === "all" ? "All statuses" : labelize(status)}</span>{statusFilter === status && <span className="text-violet-300">✓</span>}</button>)}
            </div>}
          </div>
          </div>

        {message && <p role="status" className="mt-4 rounded-xl border border-blue-300/15 bg-blue-400/[0.07] px-4 py-3 text-sm text-blue-200">{message}</p>}

        {loading ? <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/10 p-6 text-center text-sm text-slate-400">Loading reports…</div> : filteredReports.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-blue-200/[0.14] bg-black/10 p-8 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-500">✓</div><p className="mt-3 text-sm font-medium text-slate-400">No reports found</p><p className="mt-1 text-xs text-slate-600">Try changing the search or status filter.</p></div> : (
          <div className="mt-5 space-y-3">
            {filteredReports.map((report) => (
              <article key={report.id} className={`overflow-hidden rounded-2xl border bg-[#071426]/82 shadow-xl backdrop-blur-xl transition ${report.archived ? "border-white/[0.06] opacity-65" : expandedId === report.id ? "border-violet-300/25" : "border-blue-200/[0.12] hover:border-blue-200/25"}`}>
                <button type="button" aria-expanded={expandedId === report.id} onClick={() => setExpandedId((current) => current === report.id ? "" : report.id)} className="relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left sm:grid-cols-[auto_minmax(150px,0.75fr)_minmax(180px,1.25fr)_auto] sm:px-5">
                  <ReporterAvatar report={report} />
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-100">{report.user_name || "OrbitalAI user"}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{report.user_email || "No email provided"}</span></span>
                  <span className="col-span-2 min-w-0 pl-14 sm:col-span-1 sm:pl-0"><span className="block truncate text-sm font-medium text-slate-200">{report.subject}</span><span className="mt-1 flex flex-wrap items-center gap-2"><span className="rounded-full border border-violet-300/15 bg-violet-400/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">{labelize(report.category)}</span><span className="flex items-center gap-1.5 text-[11px] capitalize text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${statusStyles[report.status] || statusStyles.new}`} />{report.status}</span></span></span>
                  <span className="absolute right-8 sm:static"><svg viewBox="0 0 20 20" aria-hidden="true" className={`h-5 w-5 text-slate-400 transition ${expandedId === report.id ? "rotate-180 text-violet-300" : ""}`}><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg></span>
                </button>
                {expandedId === report.id && <div className="border-t border-white/[0.07] px-4 pb-5 pt-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">Submitted {new Date(report.created_at).toLocaleString()}</p><span className="rounded-full border border-white/[0.1] px-2.5 py-1 text-[10px] text-slate-500">ID {report.id.slice(0, 8)}</span></div>
                  <p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-white/[0.06] bg-black/15 p-3.5 text-sm leading-6 text-slate-300">{report.description}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-xs font-medium text-slate-400">Status<select value={report.status} onChange={(event) => changeReport(report.id, "status", event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c1729] px-3 py-2.5 text-sm text-white">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="text-xs font-medium text-slate-400">Priority<select value={report.priority} onChange={(event) => changeReport(report.id, "priority", event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c1729] px-3 py-2.5 text-sm text-white">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
                  <label className="mt-4 block text-xs font-medium text-slate-400">Response to user<textarea rows={4} maxLength={5000} value={report.admin_response || ""} onChange={(event) => changeReport(report.id, "admin_response", event.target.value)} placeholder="Write a response that the user can see…" className="mt-2 w-full resize-y rounded-xl border border-white/[0.1] bg-[#0c1729] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" /></label>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={Boolean(report.archived)} onChange={(event) => changeReport(report.id, "archived", event.target.checked)} className="accent-violet-500" /> Archive report</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {deleteConfirmId === report.id && <button type="button" onClick={() => setDeleteConfirmId("")} className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.05]">Cancel</button>}
                      <button type="button" onClick={() => deleteReport(report)} disabled={deletingId === report.id} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${deleteConfirmId === report.id ? "border-red-400/40 bg-red-500/20 text-red-100 hover:bg-red-500/30" : "border-red-400/20 bg-red-500/[0.07] text-red-300 hover:bg-red-500/15"}`}>{deletingId === report.id ? "Deleting…" : deleteConfirmId === report.id ? "Confirm delete" : "Delete report"}</button>
                      <button type="button" onClick={() => saveReport(report)} disabled={savingId === report.id} className="rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-500/25 disabled:opacity-50">{savingId === report.id ? "Saving…" : "Save changes"}</button>
                    </div>
                  </div>
                </div>}
              </article>
            ))}
          </div>
        )}
        </section>
      </div>
    </div>
  );
}

export default AdminReports;
