import { useState, useEffect } from "react";

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

function App() {
  const [page, setPage] = useState("home");

  const [chats, setChats] = useState(() => {
    return JSON.parse(localStorage.getItem("chats")) || [
      "Global Warming Project",
      "Chandrayaan-3 Research",
      "Python Coding Help",
      "Solar Energy Website",
    ];
  });

  const [chatMessages, setChatMessages] = useState(() => {
    return JSON.parse(localStorage.getItem("chatMessages")) || {};
  });

  const [projects, setProjects] = useState(() => {
    return JSON.parse(localStorage.getItem("projects")) || [
      "OrbitalAI",
      "Science Exhibition",
      "Solar Energy Website",
    ];
  });

  const [projectChats, setProjectChats] = useState(() => {
    return JSON.parse(localStorage.getItem("projectChats")) || {};
  });

  const [selectedChat, setSelectedChat] = useState(() => {
    return localStorage.getItem("selectedChat") || "Global Warming Project";
  });

  const [selectedProject, setSelectedProject] = useState(() => {
    return localStorage.getItem("selectedProject") || "OrbitalAI";
  });

  const [archivedChats, setArchivedChats] = useState(() => {
    return JSON.parse(localStorage.getItem("archivedChats")) || [];
  });

  const [archivedProjects, setArchivedProjects] = useState(() => {
    return JSON.parse(localStorage.getItem("archivedProjects")) || [];
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("projectChats", JSON.stringify(projectChats));
  }, [projectChats]);

  useEffect(() => {
    localStorage.setItem("selectedChat", selectedChat);
  }, [selectedChat]);

  useEffect(() => {
    localStorage.setItem("selectedProject", selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    localStorage.setItem("archivedChats", JSON.stringify(archivedChats));
  }, [archivedChats]);

  useEffect(() => {
    localStorage.setItem("archivedProjects", JSON.stringify(archivedProjects));
  }, [archivedProjects]);

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
            setSelectedChat={setSelectedChat}
            setPage={setPage}
          />
        );

      case "search":
        return <Search />;

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
        return <Home />;
    }
  };

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

      {renderPage()}
    </div>
  );
}

export default App;