import { useState } from "react";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

function Settings({
  user,
  chats,
  projects,
  projectChats,
  projectNotes,
  pinnedChats,
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

  const totalProjectChats = Object.values(projectChats || {}).flat().length;
  const totalNotes = Object.values(projectNotes || {}).flat().length;
  const archivedTotal = archivedChats.length + archivedProjects.length;

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
    <div className="relative min-h-screen bg-[#020817] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      <div className="relative px-10 py-8 pb-16">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>⚙️</span>
            <span>Settings</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Account Settings
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Manage your OrbitalAI profile, workspace details and account actions.
          </p>
        </header>

        <section className="grid grid-cols-4 gap-4 mb-8">
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

        <div className="grid grid-cols-[1fr_340px] gap-6">
          <main className="space-y-6">
            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Profile</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Your signed-in Firebase account details.
                </p>
              </div>

              <div className="p-6 grid grid-cols-2 gap-5">
                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
                  <p className="text-gray-400 text-sm mb-2">Full name</p>

                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#07101F] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-purple-500/70"
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

                <div className="col-span-2 rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
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
                  Enter your current password first, then set a new password.
                </p>
              </div>

              <div className="p-6 grid grid-cols-1 gap-4 max-w-2xl">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-[#101827] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-purple-500/70"
                />

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-[#101827] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-purple-500/70"
                />

                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-[#101827] border border-[#1B2540] rounded-xl px-4 py-3 outline-none text-white placeholder:text-gray-500 focus:border-purple-500/70"
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
              <p className="font-semibold mb-2">Logout</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sign out from this device. Your workspace data remains saved.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              Logout
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Settings;