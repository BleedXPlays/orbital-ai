import { supabase } from "../supabaseClient";

export async function getOrCreateWorkspace(user) {
  if (!user) {
    throw new Error("User missing.");
  }

  const userId = user.uid || user.id;
  const email = user.email || "";
  const name = user.displayName || user.user_metadata?.full_name || "";

  const { data: existingWorkspace, error: fetchError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existingWorkspace) {
    return mapWorkspaceFromSupabase(existingWorkspace);
  }

  const defaultWorkspace = {
    user_id: userId,
    name: name || "My Workspace",
    chats: [
      "Global Warming Project",
      "Chandrayaan-3 Research",
      "Python Coding Help",
      "Solar Energy Website",
    ],
    chat_messages: {},
    projects: ["OrbitalAI", "Science Exhibition", "Solar Energy Website"],
    project_chats: {},
    project_files: {},
    project_notes: {},
    selected_chat: "Global Warming Project",
    selected_project: "OrbitalAI",
    archived_chats: [],
    archived_projects: [],
    pinned_chats: [],
    chat_activity: {},
    activity_log: [],
  };

  const { data: createdWorkspace, error: insertError } = await supabase
    .from("workspaces")
    .insert(defaultWorkspace)
    .select()
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return mapWorkspaceFromSupabase(createdWorkspace);
}

export async function saveWorkspace(user, workspaceData) {
  if (!user) return;

  const userId = user.uid || user.id;

  const { error } = await supabase
    .from("workspaces")
    .update({
      chats: workspaceData.chats || [],
      chat_messages: workspaceData.chatMessages || {},
      projects: workspaceData.projects || [],
      project_chats: workspaceData.projectChats || {},
      project_files: workspaceData.projectFiles || {},
      project_notes: workspaceData.projectNotes || {},
      selected_chat: workspaceData.selectedChat || "",
      selected_project: workspaceData.selectedProject || "",
      archived_chats: workspaceData.archivedChats || [],
      archived_projects: workspaceData.archivedProjects || [],
      pinned_chats: workspaceData.pinnedChats || [],
      chat_activity: workspaceData.chatActivity || {},
      activity_log: workspaceData.activityLog || [],
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

function mapWorkspaceFromSupabase(data) {
  return {
    chats: data.chats || [],
    chatMessages: data.chat_messages || {},
    projects: data.projects || [],
    projectChats: data.project_chats || {},
    projectFiles: data.project_files || {},
    projectNotes: data.project_notes || {},
    selectedChat: data.selected_chat || "",
    selectedProject: data.selected_project || "",
    archivedChats: data.archived_chats || [],
    archivedProjects: data.archived_projects || [],
    pinnedChats: data.pinned_chats || [],
    chatActivity: data.chat_activity || {},
    activityLog: data.activity_log || [],
  };
}