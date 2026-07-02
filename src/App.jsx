import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getOrCreateWorkspace, saveWorkspace } from "./services/workspaceService";

import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Project from "./pages/Project";
import Search from "./pages/Search";
import BulkEdit from "./pages/BulkEdit";
import AIWorkflow from "./pages/AIWorkflow";
import Archived from "./pages/Archived";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Login from "./pages/Login";
import { getOrCreateWorkspace, saveWorkspace } from "./services/workspaceService";

function App() {
  const saveTimer = useRef(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false);

  const [page, setPage] = useState("home");
  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [projects, setProjects] = useState([]);
  const [projectChats, setProjectChats] = useState({});
  const [projectFiles, setProjectFiles] = useState({});
  const [projectNotes, setProjectNotes] = useState({});
  const [selectedChat, setSelectedChat] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [archivedChats, setArchivedChats] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [chatActivity, setChatActivity] = useState({});
  const [activityLog, setActivityLog] = useState([]);

  const addActivity = (type, title, details = "") => {
    const item = {
      id: Date.now(),
      type,
      title,
      details,
      createdAt: new Date().toISOString(),
    };

    setActivityLog((prev) => [item, ...prev].slice(0, 50));
  };

  const resetWorkspace = () => {
    setPage("home");
    setChats([]);
    setChatMessages({});
    setProjects([]);
    setProjectChats({});
    setProjectFiles({});
    setProjectNotes({});
    setSelectedChat("");
    setSelectedProject("");
    setArchivedChats([]);
    setArchivedProjects([]);
    setPinnedChats([]);
    setChatActivity({});
    setActivityLog([]);
  };

  useEffect(() => {
    const preventDefaults = (e) => {
      const isProjectDropZone = e.target.closest(
        "[data-project-drop-zone='true']"
      );

      if (isProjectDropZone) return;

      e.preventDefault();
    };

    window.addEventListener("dragenter", preventDefaults);
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      window.removeEventListener("dragenter", preventDefaults);
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      setAuthLoading(false);
      setDataLoading(true);
      setHasLoadedUserData(false);

      resetWorkspace();
      setUser(currentUser);

      if (!currentUser) {
        setDataLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      setDataLoading(true);
      setHasLoadedUserData(false);

      try {
        const data = await getOrCreateWorkspace(user);

        setChats(Array.isArray(data.chats) ? data.chats : []);
        setChatMessages(data.chatMessages || {});
        setProjects(Array.isArray(data.projects) ? data.projects : []);
        setProjectChats(data.projectChats || {});
        setProjectFiles(data.projectFiles || {});
        setProjectNotes(data.projectNotes || {});
        setSelectedChat(data.selectedChat || "");
        setSelectedProject(data.selectedProject || "");
        setArchivedChats(
          Array.isArray(data.archivedChats) ? data.archivedChats : []
        );
        setArchivedProjects(
          Array.isArray(data.archivedProjects) ? data.archivedProjects : []
        );
        setPinnedChats(Array.isArray(data.pinnedChats) ? data.pinnedChats : []);
        setChatActivity(data.chatActivity || {});
        setActivityLog(Array.isArray(data.activityLog) ? data.activityLog : []);
      } catch (error) {
        alert(error.message);
      }

      setHasLoadedUserData(true);
      setDataLoading(false);
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    const saveUserData = async () => {
      if (!user || dataLoading || !hasLoadedUserData) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(async () => {
        try {
          await saveWorkspace(user, {
            chats,
            chatMessages,
            projects,
            projectChats,
            projectFiles,
            projectNotes,
            selectedChat,
            selectedProject,
            archivedChats,
            archivedProjects,
            pinnedChats,
            chatActivity,
            activityLog,
          });
        } catch (error) {
          console.error("Failed to save workspace:", error.message);
        }
      }, 600);
    };

    saveUserData();

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    user,
    dataLoading,
    hasLoadedUserData,
    chats,
    chatMessages,
    projects,
    projectChats,
    projectFiles,
    projectNotes,
    selectedChat,
    selectedProject,
    archivedChats,
    archivedProjects,
    pinnedChats,
    chatActivity,
    activityLog,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleLogout = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    resetWorkspace();
    setHasLoadedUserData(false);
    setDataLoading(true);

    await signOut(auth);
  };

  const renderPage = () => {
    switch (page) {
      case "chat":
        return (
          <Chat
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            chats={chats}
            setChats={setChats}
            projectChats={projectChats}
            setProjectChats={setProjectChats}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            pinnedChats={pinnedChats}
            setPinnedChats={setPinnedChats}
            chatActivity={chatActivity}
            setChatActivity={setChatActivity}
            addActivity={addActivity}
          />
        );

      case "project":
        return (
          <Project
            user={user}
            selectedProject={selectedProject}
            projectChats={projectChats}
            setProjectChats={setProjectChats}
            projectFiles={projectFiles}
            setProjectFiles={setProjectFiles}
            projectNotes={projectNotes}
            setProjectNotes={setProjectNotes}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            archivedChats={archivedChats}
            setArchivedChats={setArchivedChats}
            pinnedChats={pinnedChats}
            setPinnedChats={setPinnedChats}
            chatActivity={chatActivity}
            setChatActivity={setChatActivity}
            setPage={setPage}
            addActivity={addActivity}
          />
        );

      case "search":
        return (
          <Search
            chats={chats}
            projects={projects}
            projectChats={projectChats}
            chatMessages={chatMessages}
            projectFiles={projectFiles}
            projectNotes={projectNotes}
            setSelectedChat={setSelectedChat}
            setSelectedProject={setSelectedProject}
            setPage={setPage}
          />
        );

      case "bulk":
        return (
          <BulkEdit
            chats={chats}
            setChats={setChats}
            projects={projects}
            setProjects={setProjects}
            projectChats={projectChats}
            setProjectChats={setProjectChats}
            archivedChats={archivedChats}
            setArchivedChats={setArchivedChats}
            archivedProjects={archivedProjects}
            setArchivedProjects={setArchivedProjects}
          />
        );

      case "workflow":
        return <AIWorkflow />;

      case "archived":
        return (
          <Archived
            chats={chats}
            setChats={setChats}
            projects={projects}
            setProjects={setProjects}
            projectChats={projectChats}
            setProjectChats={setProjectChats}
            archivedChats={archivedChats}
            setArchivedChats={setArchivedChats}
            archivedProjects={archivedProjects}
            setArchivedProjects={setArchivedProjects}
            addActivity={addActivity}
          />
        );

      case "settings":
        return (
          <Settings
            user={user}
            chats={chats}
            projects={projects}
            projectChats={projectChats}
            projectNotes={projectNotes}
            pinnedChats={pinnedChats}
            archivedChats={archivedChats}
            archivedProjects={archivedProjects}
            handleLogout={handleLogout}
          />
        );

      case "help":
        return <Help />;

      default:
        return (
          <Home
            chats={chats}
            projects={projects}
            projectChats={projectChats}
            projectFiles={projectFiles}
            projectNotes={projectNotes}
            archivedChats={archivedChats}
            archivedProjects={archivedProjects}
            pinnedChats={pinnedChats}
            chatActivity={chatActivity}
            activityLog={activityLog}
            setSelectedChat={setSelectedChat}
            setSelectedProject={setSelectedProject}
            setPage={setPage}
          />
        );
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading OrbitalAI...
      </div>
    );
  }

  if (!user) return <Login />;

 return (
  <div className="h-screen bg-black flex overflow-hidden">
      <Sidebar
        setPage={setPage}
        chats={chats}
        setChats={setChats}
        projects={projects}
        setProjects={setProjects}
        projectChats={projectChats}
        setProjectChats={setProjectChats}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        archivedChats={archivedChats}
        setArchivedChats={setArchivedChats}
        archivedProjects={archivedProjects}
        setArchivedProjects={setArchivedProjects}
        pinnedChats={pinnedChats}
        setPinnedChats={setPinnedChats}
        chatActivity={chatActivity}
        setChatActivity={setChatActivity}
        addActivity={addActivity}
      />

      <div className="flex-1 relative h-screen overflow-y-auto">
        <div className="absolute top-5 right-6 z-50">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-[#101827] border border-[#1B2540] text-white hover:bg-[#141f33]"
          >
            Logout
          </button>
        </div>

        <div className="pr-32">{renderPage()}</div>
      </div>

      <CommandPalette
        chats={chats}
        projects={projects}
        projectChats={projectChats}
        setSelectedChat={setSelectedChat}
        setSelectedProject={setSelectedProject}
        setPage={setPage}
      />
    </div>
  );
}

export default App;