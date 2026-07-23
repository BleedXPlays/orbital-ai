import { useState } from "react";
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
import { deleteWorkspaceData } from "../services/workspaceService";

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

  const totalProjectChats = Object.values(projectChats || {}).flat().length;
  const totalNotes = Object.values(projectNotes || {}).flat().length;
  const archivedTotal = archivedChats.length + archivedProjects.length;

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

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(91,110,255,0.12),transparent_35%),radial-gradient(circle_at_90%_75%,rgba(147,51,234,0.07),transparent_30%)]" />

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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
          <main className="space-y-6">
            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Profile</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Your signed-in Firebase account details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-6">
                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
                  <p className="text-gray-400 text-sm mb-2">Full name</p>

                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#07101F] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-blue-300/40"
                  />

                  <button
                    onClick={saveDisplayName}
                    disabled={isSavingName}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSavingName ? "Saving..." : "Save name"}
                  </button>

                  {nameMessage && (
                    <p className="text-sm text-gray-400 mt-3">{nameMessage}</p>
                  )}
                </div>

                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
                  <p className="text-gray-400 text-sm mb-2">Email</p>
                  <p className="text-lg font-semibold break-words">
                    {user?.email || "Not available"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5 sm:col-span-2">
                  <p className="text-gray-400 text-sm mb-2">User ID</p>
                  <p className="text-sm break-all text-gray-300">
                    {user?.uid || "Not available"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Change password</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {supportsPasswordChange
                    ? "Enter your current password first, then set a new password."
                    : "This account signs in through Google, so its password is managed by Google."}
                </p>
              </div>

              {supportsPasswordChange ? (
                <div className="p-6 grid grid-cols-1 gap-4 max-w-2xl">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full bg-[#101827] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-blue-300/40"
                  />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-[#101827] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-blue-300/40"
                  />

                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-[#101827] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-blue-300/40"
                  />

                  <button
                    onClick={changePassword}
                    disabled={isChangingPassword}
                    className="w-fit px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isChangingPassword ? "Changing..." : "Change password"}
                  </button>

                  {passwordMessage && (
                    <p className="text-sm text-gray-400">{passwordMessage}</p>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <p className="max-w-2xl rounded-2xl border border-blue-300/15 bg-blue-400/[0.06] p-4 text-sm leading-6 text-slate-300">
                    To change your password, open your Google Account security settings. OrbitalAI never receives or stores your Google password.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Workspace statistics</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Current saved structure inside your OrbitalAI workspace.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {[
                  ["Total global chats", chats.length],
                  ["Total project chats", totalProjectChats],
                  ["Projects", projects.length],
                  ["Notes", totalNotes],
                  ["Pinned chats", pinnedChats.length],
                  ["Archived items", archivedTotal],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center rounded-2xl bg-[#101827] border border-[#1B2540] p-4"
                  >
                    <span className="text-gray-300">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-6 h-fit shadow-2xl shadow-purple-950/10">
            <h2 className="text-xl font-bold mb-5">Account actions</h2>

            <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5 mb-5">
              <p className="font-semibold mb-2">Export workspace</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Download a JSON backup of your chats, projects, notes, and saved workspace details.
              </p>
              <button
                type="button"
                onClick={exportWorkspace}
                className="mt-4 w-full rounded-xl border border-blue-300/20 bg-blue-400/[0.07] px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/[0.12]"
              >
                Download backup
              </button>
            </div>

            <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5 mb-5">
              <p className="font-semibold mb-2">Logout</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sign out from this device. Your workspace data remains saved.
              </p>
            </div>

            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="w-full px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              Logout
            </button>

            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="font-semibold text-red-200">Delete account</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Permanently remove your workspace, stored files, and Firebase account. Download a backup first if needed.
              </p>
              {supportsPasswordChange && (
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                  className="mt-4 w-full rounded-xl border border-red-400/20 bg-[#101827] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-red-300/40"
                />
              )}
              {deleteMessage && (
                <p className="mt-3 text-sm leading-5 text-red-300" role="alert">
                  {deleteMessage}
                </p>
              )}
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
                className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {isDeletingAccount ? "Deleting account…" : "Delete account"}
              </button>
            </div>
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
