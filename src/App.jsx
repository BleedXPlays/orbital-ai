import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getOrCreateWorkspace, saveWorkspace } from "./services/workspaceService";

import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";

const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Project = lazy(() => import("./pages/Project"));
const Search = lazy(() => import("./pages/Search"));
const BulkEdit = lazy(() => import("./pages/BulkEdit"));
const AIWorkflow = lazy(() => import("./pages/AIWorkflow"));
const Archived = lazy(() => import("./pages/Archived"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const Login = lazy(() => import("./pages/Login"));

const PageLoadingFallback = () => (
  <div className="flex h-full min-h-full items-center justify-center bg-[#020817] text-white">
    Loading OrbitalAI...
  </div>
);

const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getPathFromWorkspaceState = ({
  page,
  selectedChat,
  selectedProject,
}) => {
  if (page === "chat") {
    return selectedChat ? `/chat/${slugify(selectedChat)}` : "/chat";
  }

  if (page === "project") {
    return selectedProject
      ? `/project/${slugify(selectedProject)}`
      : "/project";
  }

  if (page === "search") return "/search";
  if (page === "bulk") return "/bulk-edit";
  if (page === "workflow") return "/ai-workflow";
  if (page === "archived") return "/archived";
  if (page === "settings") return "/settings";
  if (page === "help") return "/help";

  return "/";
};

function App() {
  const saveTimer = useRef(null);
  const mainContentRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [appError, setAppError] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const findItemBySlug = (items, slug) => {
    return items.find((item) => slugify(item) === slug) || "";
  };

  const getAllChatNames = () => {
    const projectChatNames = Object.values(projectChats).flat();
    return [...chats, ...projectChatNames];
  };

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
    setRouteReady(false);
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
    setAppError("");
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
      setRouteReady(false);

      resetWorkspace();
      setUser(currentUser);

      if (!currentUser) {
        setDataLoading(false);
        setRouteReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      setDataLoading(true);
      setHasLoadedUserData(false);
      setRouteReady(false);
      setAppError("");

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
        setAppError(error.message || "Failed to load workspace.");
      }

      setHasLoadedUserData(true);
      setDataLoading(false);
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    if (!user || dataLoading || !hasLoadedUserData) return;

    const frame = window.requestAnimationFrame(() => {
      const path = location.pathname;
      const parts = path.split("/").filter(Boolean);
      const firstPart = parts[0] || "";
      const secondPart = parts[1] || "";

      if (path === "/") {
        setPage("home");
        setRouteReady(true);
        return;
      }

      if (firstPart === "chat") {
        const matchedChat = secondPart
          ? findItemBySlug(getAllChatNames(), secondPart)
          : "";

        setSelectedChat(matchedChat);
        setSelectedProject("");
        setPage("chat");
        setRouteReady(true);
        return;
      }

      if (firstPart === "project") {
        const matchedProject = secondPart
          ? findItemBySlug(projects, secondPart)
          : "";

        setSelectedProject(matchedProject);
        setPage("project");
        setRouteReady(true);
        return;
      }

      if (firstPart === "search") {
        setPage("search");
        setRouteReady(true);
        return;
      }

      if (firstPart === "bulk-edit") {
        setPage("bulk");
        setRouteReady(true);
        return;
      }

      if (firstPart === "ai-workflow") {
        setPage("workflow");
        setRouteReady(true);
        return;
      }

      if (firstPart === "archived") {
        setPage("archived");
        setRouteReady(true);
        return;
      }

      if (firstPart === "settings") {
        setPage("settings");
        setRouteReady(true);
        return;
      }

      if (firstPart === "help") {
        setPage("help");
        setRouteReady(true);
        return;
      }

      setPage("home");
      setRouteReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
    // Route changes select workspace items. Local chat/project list changes
    // are handled by the state-to-route effect below, so they must not rerun
    // this effect with a stale URL during creation or automatic renaming.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user, dataLoading, hasLoadedUserData]);

  useEffect(() => {
    if (!user || dataLoading || !hasLoadedUserData || !routeReady) return;

    const nextPath = getPathFromWorkspaceState({
      page,
      selectedChat,
      selectedProject,
    });

    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  }, [
    page,
    selectedChat,
    selectedProject,
    user,
    dataLoading,
    hasLoadedUserData,
    routeReady,
    location.pathname,
    navigate,
  ]);

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
    if (!mainContentRef.current) return;

    mainContentRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMobileSidebarOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

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
            user={user}
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
            setChats={setChats}
            projects={projects}
            setProjects={setProjects}
            projectChats={projectChats}
            setProjectChats={setProjectChats}
            projectFiles={projectFiles}
            projectNotes={projectNotes}
            archivedChats={archivedChats}
            archivedProjects={archivedProjects}
            pinnedChats={pinnedChats}
            chatActivity={chatActivity}
            setChatActivity={setChatActivity}
            activityLog={activityLog}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            setSelectedChat={setSelectedChat}
            setSelectedProject={setSelectedProject}
            setPage={setPage}
            addActivity={addActivity}
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

  if (!user) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <div className="relative flex h-dvh w-screen overflow-hidden bg-[#020817]">
      {appError && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] max-w-xl rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-3 text-sm shadow-2xl shadow-red-950/20">
          {appError}
        </div>
      )}

      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setIsMobileSidebarOpen(true)}
        className={`fixed left-3 top-3 z-[7000] flex h-11 w-11 items-center justify-center rounded-xl border border-[#1B2540] bg-[#07101F]/95 text-xl text-white shadow-xl backdrop-blur lg:hidden ${
          isMobileSidebarOpen ? "hidden" : ""
        }`}
      >
        ☰
      </button>

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-[8000] bg-black/65 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-[9000] h-full lg:static lg:z-auto lg:block ${
          isMobileSidebarOpen ? "block" : "hidden"
        }`}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="absolute right-3 top-3 z-[9100] flex h-10 w-10 items-center justify-center rounded-xl border border-[#1B2540] bg-[#101827] text-2xl text-gray-200 lg:hidden"
        >
          ×
        </button>

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
      </div>

      <main
        ref={mainContentRef}
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#020817]"
      >
        <Suspense fallback={<PageLoadingFallback />}>
          <div className="h-full min-h-0 w-full">{renderPage()}</div>
        </Suspense>
      </main>

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
