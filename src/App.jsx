import { useState, useEffect } from "react";
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

  const defaultProjects = ["OrbitalAI", "Science Exhibition", "Solar Energy Website"];

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [page, setPage] = useState("home");

  const [chats, setChats] = useState(defaultChats);
  const [chatMessages, setChatMessages] = useState({});
  const [projects, setProjects] = useState(defaultProjects);
  const [projectChats, setProjectChats] = useState({});
  const [projectFiles, setProjectFiles] = useState({});
  const [projectNotes, setProjectNotes] = useState({});
  const [selectedChat, setSelectedChat] = useState("Global Warming Project");
  const [selectedProject, setSelectedProject] = useState("OrbitalAI");
  const [archivedChats, setArchivedChats] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

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

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        setChats(data.chats || []);
        setChatMessages(data.chatMessages || {});
        setProjects(data.projects || []);
        setProjectChats(data.projectChats || {});
        setProjectFiles(data.projectFiles || {});
        setProjectNotes(data.projectNotes || {});
        setSelectedChat(data.selectedChat || "");
        setSelectedProject(data.selectedProject || "");
        setArchivedChats(data.archivedChats || []);
        setArchivedProjects(data.archivedProjects || []);
      } else {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          createdAt: new Date().toISOString(),
          chats: defaultChats,
          chatMessages: {},
          projects: defaultProjects,
          projectChats: {},
          projectFiles: {},
          projectNotes: {},
          selectedChat: "Global Warming Project",
          selectedProject: "OrbitalAI",
          archivedChats: [],
          archivedProjects: [],
        });
      }

      setDataLoading(false);
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    const saveUserData = async () => {
      if (!user || dataLoading) return;

      const userRef = doc(db, "users", user.uid);

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
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    };

    saveUserData();
  }, [
    user,
    dataLoading,
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
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleLogout = async () => {
    await signOut(auth);
    setPage("home");
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
          />
        );

      case "project":
        return (
          <Project
            selectedProject={selectedProject}
            projectChats={projectChats}
            setProjectChats={setProjectChats}
            chats={chats}
            setChats={setChats}
            projectFiles={projectFiles}
            setProjectFiles={setProjectFiles}
            projectNotes={projectNotes}
            setProjectNotes={setProjectNotes}
            setSelectedChat={setSelectedChat}
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
      />

      <div className="flex-1 relative">
        <button
          onClick={handleLogout}
          className="absolute top-5 right-6 z-50 px-4 py-2 rounded-xl bg-[#101827] border border-[#1B2540] text-white hover:bg-[#141f33]"
        >
          Logout
        </button>

        {renderPage()}
      </div>
    </div>
  );
}

export default App;