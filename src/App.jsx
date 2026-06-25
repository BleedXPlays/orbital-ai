import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import Sidebar from "./components/Sidebar";

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

function App() {
  const defaultChats = [
    "Global Warming Project",
    "Chandrayaan-3 Research",
    "Python Coding Help",
    "Solar Energy Website",
  ];

  const defaultProjects = [
    "OrbitalAI",
    "Science Exhibition",
    "Solar Energy Website",
  ];

  const saveTimer = useRef(null);

  const [user, setUser] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);
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
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      setAuthLoading(false);
      setDataLoading(true);
      setHasLoadedUserData(false);

      resetWorkspace();
      setUser(currentUser);
      setActiveUserId(currentUser ? currentUser.uid : null);

      if (!currentUser) {
        setDataLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !activeUserId) return;

      setDataLoading(true);
      setHasLoadedUserData(false);

      const userRef = doc(db, "users", activeUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

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
      } else {
        const initialData = {
          name: user.displayName || "",
          email: user.email,
          createdAt: new Date().toISOString(),
          chats: defaultChats,
          chatMessages: {},
          projects: defaultProjects,
          projectChats: {},
          projectFiles: {},
          projectNotes: {},
          selectedChat: defaultChats[0],
          selectedProject: defaultProjects[0],
          archivedChats: [],
          archivedProjects: [],
          pinnedChats: [],
          chatActivity: {},
        };

        await setDoc(userRef, initialData);

        setChats(initialData.chats);
        setChatMessages(initialData.chatMessages);
        setProjects(initialData.projects);
        setProjectChats(initialData.projectChats);
        setProjectFiles(initialData.projectFiles);
        setProjectNotes(initialData.projectNotes);
        setSelectedChat(initialData.selectedChat);
        setSelectedProject(initialData.selectedProject);
        setArchivedChats(initialData.archivedChats);
        setArchivedProjects(initialData.archivedProjects);
        setPinnedChats(initialData.pinnedChats);
        setChatActivity(initialData.chatActivity);
      }

      setHasLoadedUserData(true);
      setDataLoading(false);
    };

    loadUserData();
  }, [user, activeUserId]);

  useEffect(() => {
    const saveUserData = async () => {
      if (!user || !activeUserId || dataLoading || !hasLoadedUserData) return;

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(async () => {
        const userRef = doc(db, "users", activeUserId);

        await setDoc(
          userRef,
          {
            name: user.displayName || "",
            email: user.email,
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
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }, 600);
    };

    saveUserData();

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [
    user,
    activeUserId,
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
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleLogout = async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

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
          />
        );

      case "project":
        return (
          <Project
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
          />
        );

      case "settings":
        return <Settings />;

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

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-black flex">
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
      />

      <div className="flex-1 relative">
  <div className="absolute top-5 right-6 z-50">
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-xl bg-[#101827] border border-[#1B2540] text-white hover:bg-[#141f33]"
    >
      Logout
    </button>
  </div>

  <div className="pr-32">
    {renderPage()}
  </div>
</div>
    </div>
  );
}

export default App;