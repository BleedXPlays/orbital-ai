import { useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteUser,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import ConfirmModal from "../components/ConfirmModal";
import PasswordRequirements from "../components/PasswordRequirements";
import { deleteWorkspaceData } from "../services/workspaceService";
import {
  getPasswordPolicyError,
  isPasswordValid,
} from "../../shared/passwordPolicy";

function Settings({
  user,
  chats,
  projects,
  projectChats,
  projectNotes,
  projectFiles,
  chatMessages,
  pinnedChats,
  chatActivity,
  activityLog,
  selectedChat,
  selectedProject,
  archivedChats,
  archivedProjects,
  handleLogout,
  usageSummary,
}) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const supportsPasswordChange = Boolean(
    user?.providerData?.some((provider) => provider.providerId === "password")
  );
  const supportsGoogleSignIn = Boolean(
    user?.providerData?.some((provider) => provider.providerId === "google.com")
  );
  const accountInitial =
    (displayName || user?.email || "O").trim().charAt(0).toUpperCase() || "O";
  const signInMethod = supportsGoogleSignIn
    ? "Google"
    : supportsPasswordChange
      ? "Email and password"
      : "Secure sign-in";

  const totalProjectChats = Object.values(projectChats || {}).flat().length;
  const totalNotes = Object.values(projectNotes || {}).flat().length;
  const archivedTotal = archivedChats.length + archivedProjects.length;
  const formatUsageReset = (resetAt) => {
    if (!resetAt) return "Your full allowance is currently available.";
    const resetDate = new Date(resetAt);
    if (Number.isNaN(resetDate.getTime())) return "Reset time unavailable";

    return `Next allowance refresh: ${new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(resetDate)}`;
  };

  const exportWorkspace = () => {
    const workspaceExport = {
      exportedAt: new Date().toISOString(),
      account: {
        uid: user?.uid || "",
        email: user?.email || "",
        displayName: user?.displayName || "",
      },
      workspace: {
        chats,
        chatMessages: chatMessages || {},
        projects,
        projectChats: projectChats || {},
        projectFiles: projectFiles || {},
        projectNotes: projectNotes || {},
        selectedChat: selectedChat || "",
        selectedProject: selectedProject || "",
        pinnedChats: pinnedChats || [],
        chatActivity: chatActivity || {},
        activityLog: activityLog || [],
        archivedChats: archivedChats || [],
        archivedProjects: archivedProjects || [],
      },
    };
    const blob = new Blob([JSON.stringify(workspaceExport, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeDate = new Date().toISOString().slice(0, 10);
    link.href = downloadUrl;
    link.download = `orbitalai-workspace-${safeDate}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const deleteAccount = async () => {
    setDeleteMessage("");

    if (!user) {
      setDeleteMessage("Account not found. Please sign in again.");
      return;
    }

    if (supportsPasswordChange && !deletePassword) {
      setDeleteMessage("Enter your current password before deleting the account.");
      return;
    }

    setIsDeletingAccount(true);
    try {
      if (supportsPasswordChange) {
        const credential = EmailAuthProvider.credential(
          user.email,
          deletePassword
        );
        await reauthenticateWithCredential(user, credential);
      } else if (supportsGoogleSignIn) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }

      await deleteWorkspaceData(user, {
        projectFiles,
        chatMessages,
        archivedProjects,
        archivedChats,
      });
      await deleteUser(user);
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setDeleteMessage("The password you entered is incorrect.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setDeleteMessage("Account deletion was cancelled.");
      } else if (error.code === "auth/requires-recent-login") {
        setDeleteMessage("Please sign out, sign in again, and retry account deletion.");
      } else {
        setDeleteMessage(
          error.message || "The account could not be deleted. Please try again."
        );
      }
    } finally {
      setDeleteConfirmOpen(false);
      setIsDeletingAccount(false);
    }
  };

  const saveDisplayName = async () => {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setNameMessage("Name cannot be empty.");
      return;
    }

    if (!user) {
      setNameMessage("User not found.");
      return;
    }

    setIsSavingName(true);
    setNameMessage("");

    try {
      await updateProfile(user, {
        displayName: trimmedName,
      });

      setNameMessage("Name updated successfully. Refresh if it does not update instantly.");
    } catch (error) {
      setNameMessage(error.message || "Failed to update name.");
    } finally {
      setIsSavingName(false);
    }
  };

  const changePassword = async () => {
    setPasswordMessage("");

    if (!user?.email) {
      setPasswordMessage("Email account not found.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage("Please fill all password fields.");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setPasswordMessage(getPasswordPolicyError(newPassword));
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage("Your new password must be different from your current password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setPasswordMessage("Current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        setPasswordMessage("New password is too weak.");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordMessage("Please logout, login again, and then change your password.");
      } else {
        setPasswordMessage(error.message || "Failed to change password.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white">
      <div className="orbital-earth-horizon pointer-events-none absolute inset-0 opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_4%,rgba(77,126,255,0.18),transparent_34%),radial-gradient(circle_at_82%_28%,rgba(139,92,246,0.12),transparent_28%),linear-gradient(180deg,rgba(2,7,19,0.16)_0%,rgba(2,7,19,0.5)_58%,rgba(2,7,19,0.74)_100%)]" />

      <div className="relative px-4 pb-12 pt-16 sm:px-6 sm:py-8 sm:pb-16 lg:px-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>⚙️</span>
            <span>Settings</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Account Settings
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Manage your OrbitalAI profile, workspace details and account actions.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 xl:grid-cols-4">
          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Global chats</p>
            <h2 className="text-3xl font-bold mt-2">{chats.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Projects</p>
            <h2 className="text-3xl font-bold mt-2">{projects.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Project chats</p>
            <h2 className="text-3xl font-bold mt-2">{totalProjectChats}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Notes</p>
            <h2 className="text-3xl font-bold mt-2">{totalNotes}</h2>
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-3xl border border-blue-300/[0.12] bg-[#07101F]/90 shadow-2xl shadow-blue-950/20 sm:mb-8">
          <div className="border-b border-[#1B2540] bg-[#020817]/50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/70">
              Usage dashboard
            </p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Your current 8-hour allowance
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              These counters come directly from OrbitalAI’s server limits.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            {[
              ["AI messages", usageSummary?.chat],
              ["Document reads", usageSummary?.documents],
            ].map(([label, usage]) => {
              const limit = Number(usage?.limit || 0);
              const remaining = Number(usage?.remaining || 0);
              const usedPercent = limit
                ? Math.min(100, Math.max(0, ((limit - remaining) / limit) * 100))
                : 0;

              return (
                <div
                  key={label}
                  className="rounded-2xl border border-[#1B2540] bg-[#101827]/90 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 text-3xl font-bold text-white">
                        {remaining}
                        <span className="ml-1 text-base font-medium text-slate-500">
                          / {limit}
                        </span>
                      </p>
                    </div>
                    <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                      remaining
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {formatUsageReset(usage?.resetAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <main className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-blue-300/[0.13] bg-[linear-gradient(145deg,rgba(7,16,31,0.96),rgba(8,16,35,0.90))] shadow-[0_24px_80px_rgba(2,6,23,0.32)]">
              <div className="border-b border-white/[0.07] bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_42%)] p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-[linear-gradient(145deg,rgba(37,99,235,0.28),rgba(124,58,237,0.42))] text-xl font-bold text-white shadow-[0_14px_35px_rgba(76,29,149,0.3)]">
                      {accountInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Profile</p>
                      <h2 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
                        {displayName || "OrbitalAI member"}
                      </h2>
                      <p className="mt-1 truncate text-sm text-slate-400">{user?.email || "Email unavailable"}</p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    Active account
                  </span>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                <div>
                  <label htmlFor="settings-display-name" className="text-sm font-medium text-slate-300">Full name</label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="settings-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="min-w-0 flex-1 rounded-2xl border border-blue-200/[0.14] bg-[#050d1d]/80 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
                    />
                    <button
                      onClick={saveDisplayName}
                      disabled={isSavingName}
                      className="rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,#2563eb_0%,#6d4aff_58%,#7c3aed_100%)] px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingName ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                  {nameMessage && <p className="mt-3 text-sm text-slate-400">{nameMessage}</p>}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email address</p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-200">{user?.email || "Not available"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sign-in method</p>
                    <p className="mt-2 text-sm font-medium text-slate-200">{signInMethod}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User ID</p>
                    <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-400">{user?.uid || "Not available"}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-blue-300/[0.13] bg-[linear-gradient(145deg,rgba(7,16,31,0.96),rgba(8,16,35,0.90))] shadow-[0_24px_80px_rgba(2,6,23,0.3)]">
              <div className="border-b border-white/[0.07] p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Security</p>
                <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Change password</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {supportsPasswordChange
                    ? "Confirm your current password, then create a secure replacement."
                    : "This account signs in through Google, so its password is managed by Google."}
                </p>
              </div>

              {supportsPasswordChange ? (
                <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-2">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#050d1d]/80 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10 md:col-span-2"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#050d1d]/80 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#050d1d]/80 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
                  />
                  <div className="md:col-span-2">
                    <PasswordRequirements password={newPassword} confirmPassword={confirmNewPassword} />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:col-span-2">
                    <button
                      onClick={changePassword}
                      disabled={isChangingPassword || !currentPassword || !isPasswordValid(newPassword) || newPassword !== confirmNewPassword || newPassword === currentPassword}
                      className="rounded-2xl border border-violet-300/20 bg-[linear-gradient(135deg,#2563eb,#7048e8)] px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isChangingPassword ? "Changing..." : "Update password"}
                    </button>
                    {passwordMessage && <p className="text-sm text-slate-400">{passwordMessage}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-5 sm:p-7">
                  <p className="max-w-2xl rounded-2xl border border-blue-300/15 bg-blue-400/[0.06] p-4 text-sm leading-6 text-slate-300">
                    To change your password, open your Google Account security settings. OrbitalAI never receives or stores your Google password.
                  </p>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[28px] border border-blue-300/[0.13] bg-[linear-gradient(145deg,rgba(7,16,31,0.96),rgba(8,16,35,0.90))] shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
              <div className="border-b border-white/[0.07] p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Workspace</p>
                <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Saved activity</h2>
                <p className="mt-2 text-sm text-slate-400">A quick view of the content stored in your workspace.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:p-7">
                {[["Global chats", chats.length], ["Project chats", totalProjectChats], ["Projects", projects.length], ["Notes", totalNotes], ["Pinned", pinnedChats.length], ["Archived", archivedTotal]].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-2xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <section className="rounded-[28px] border border-blue-300/[0.13] bg-[linear-gradient(145deg,rgba(7,16,31,0.97),rgba(8,16,35,0.92))] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.28)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Workspace tools</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Your data</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Keep a portable copy of your workspace or review how your information is handled.</p>
              <button type="button" onClick={exportWorkspace} className="mt-5 w-full rounded-2xl border border-blue-300/20 bg-blue-400/[0.08] px-4 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-300/35 hover:bg-blue-400/[0.13]">
                Download workspace backup
              </button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link to="/privacy" className="rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.07]">Privacy</Link>
                <Link to="/terms" className="rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.07]">Terms</Link>
              </div>
            </section>

            <section className="rounded-[28px] border border-blue-300/[0.13] bg-[linear-gradient(145deg,rgba(7,16,31,0.97),rgba(8,16,35,0.92))] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.28)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Session</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Sign out safely</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Your saved workspace remains available the next time you sign in.</p>
              <button onClick={() => setLogoutConfirmOpen(true)} className="mt-5 w-full rounded-2xl border border-slate-500/30 bg-slate-400/[0.06] px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-400/45 hover:bg-slate-400/[0.11]">
                Log out
              </button>
            </section>

            <section className="rounded-[28px] border border-red-400/20 bg-[linear-gradient(145deg,rgba(35,10,22,0.75),rgba(16,10,27,0.92))] p-5 shadow-[0_24px_70px_rgba(69,10,10,0.16)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Danger zone</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Delete account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Permanently removes your workspace, stored files, and Firebase account. Download a backup first if needed.</p>
              {supportsPasswordChange && (
                <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Current password" autoComplete="current-password" className="mt-5 w-full rounded-2xl border border-red-400/20 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-300/45 focus:ring-4 focus:ring-red-500/10" />
              )}
              {deleteMessage && <p className="mt-3 text-sm leading-5 text-red-300" role="alert">{deleteMessage}</p>}
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => {
                  setDeleteMessage("");
                  if (supportsPasswordChange && !deletePassword) {
                    setDeleteMessage("Enter your current password before deleting the account.");
                    return;
                  }
                  setDeleteConfirmOpen(true);
                }}
                className="mt-5 w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400/45 hover:bg-red-500/17 disabled:opacity-50"
              >
                {isDeletingAccount ? "Deleting account…" : "Delete account"}
              </button>
            </section>
          </aside>
        </div>
      </div>

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        title="Log out of OrbitalAI?"
        message="You will be signed out from this device. Your chats, projects and saved workspace will remain available when you sign in again."
        confirmText="Log out"
        cancelText="Stay signed in"
        danger={true}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={async () => {
          setLogoutConfirmOpen(false);
          await handleLogout();
        }}
      />
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Permanently delete your account?"
        message="This removes your chats, projects, notes, stored files, and login account. This action cannot be undone."
        confirmText="Delete permanently"
        cancelText="Keep account"
        danger={true}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={deleteAccount}
      />
    </div>
  );
}

export default Settings;
