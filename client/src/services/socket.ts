import { io, Socket } from "socket.io-client";
import { Item, Folder } from "../types";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(import.meta.env.VITE_SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupListeners(
    onUpdateState: (data: { items?: Item[]; folders?: Folder[] }) => void
  ) {
    if (!this.socket) return () => {};

    this.socket.on("connect", () => {
      console.log("Client: Connected to server", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Client: Connection error:", error);
    });

    this.socket.on("disconnect", () => {
      console.log("Client: Disconnected from server");
    });

    this.socket.on("updateState", onUpdateState);

    return () => {
      this.socket?.off("connect");
      this.socket?.off("connect_error");
      this.socket?.off("disconnect");
      this.socket?.off("updateState");
    };
  }

  emitAddItem(item: Item) {
    this.socket?.emit("addItem", item);
  }

  emitAddFolder(folder: Folder) {
    this.socket?.emit("addFolder", folder);
  }

  emitUpdateItems(items: Item[]) {
    this.socket?.emit("updateItems", items);
  }

  emitUpdateFolders(folders: Folder[]) {
    this.socket?.emit("updateFolders", folders);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
