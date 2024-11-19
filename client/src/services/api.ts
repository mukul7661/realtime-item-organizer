import { Socket } from "socket.io-client";
import { Item, Folder } from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const fetchInitialState = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/api/initial-state`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch initial state:", error);
    throw error;
  }
};

export const createItem = async (formData: FormData) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/items`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to create item:", error);
    throw error;
  }
};

export const socketService = {
  emitAddItem: (socket: Socket, item: Item) => {
    socket.emit("addItem", item);
  },

  emitAddFolder: (socket: Socket, folder: Folder) => {
    socket.emit("addFolder", folder);
  },

  emitUpdateItems: (socket: Socket, items: Item[]) => {
    socket.emit("updateItems", items);
  },

  emitUpdateFolders: (socket: Socket, folders: Folder[]) => {
    socket.emit("updateFolders", folders);
  },

  setupSocketListeners: (
    socket: Socket,
    onUpdateState: (data: { items?: Item[]; folders?: Folder[] }) => void,
    onNewItem: (data: { newItem: Item }) => void
  ) => {
    socket.on("connect", () => {
      console.log("Client: Connected to server", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Client: Connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Client: Disconnected from server");
    });

    socket.on("newItem", onNewItem);

    socket.on("updateState", onUpdateState);

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("newItem");
      socket.off("updateState");
    };
  },
};
