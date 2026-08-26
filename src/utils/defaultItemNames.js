export const getNextDefaultItemName = (itemNames = [], prefix) => {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const defaultNamePattern = new RegExp(`^${escapedPrefix} (\\d+)$`);
  const usedNumbers = new Set(
    itemNames
      .map((name) => defaultNamePattern.exec(String(name).trim()))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .filter((number) => Number.isInteger(number) && number > 0)
  );

  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) nextNumber += 1;

  return `${prefix} ${nextNumber}`;
};

export const getNextNewChatName = (chatNames) =>
  getNextDefaultItemName(chatNames, "New Chat");

export const getNextNewProjectName = (projectNames) =>
  getNextDefaultItemName(projectNames, "New Project");
