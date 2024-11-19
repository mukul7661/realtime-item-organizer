import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import styled from "@emotion/styled";
import DraggableItem from "./components/DraggableItem";
import DraggableFolder from "./components/DraggableFolder";
import DroppableRoot from "./components/DroppableRoot";
import { Item, Folder } from "./types";
import { socketService } from "./services/socket";
import { createItem, fetchInitialState } from "./services/api";

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  useEffect(() => {
    socketService.connect();

    const cleanup = socketService.setupListeners(
      ({ items: newItems, folders: newFolders }) => {
        if (newItems) setItems(newItems);
        if (newFolders) setFolders(newFolders);
      },
      ({ newItem }) => {
        setItems((prevItems) => [...prevItems, newItem]);
      }
    );

    return () => {
      cleanup();
      socketService.disconnect();
    };
  }, []);
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const data = await fetchInitialState();
        if (data.items) setItems(data.items);
        if (data.folders) setFolders(data.folders);
      } catch (error) {
        console.error("Failed to load initial state:", error);
      }
    };

    loadInitialState();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    const item = items.find((item) => item.id === activeId);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeFolder = folders.find((f) => f.id === activeId);

    if (activeFolder) {
      const oldIndex = folders.findIndex((f) => f.id === activeId);
      const newIndex = folders.findIndex((f) => f.id === overId);

      if (newIndex !== -1) {
        const newFolders = arrayMove(folders, oldIndex, newIndex).map(
          (folder, index) => ({ ...folder, order: index })
        );
        setFolders(newFolders);
        socketService.emitUpdateFolders(newFolders);
      }
      return;
    }

    const activeItem = items.find((item) => item.id === activeId);
    const overItem = items.find((item) => item.id === overId);

    if (overId === "root-container") {
      if (activeItem && activeItem.folderId !== null) {
        const updatedItems = items.map((item) =>
          item.id === activeId ? { ...item, folderId: null } : item
        );
        setItems(updatedItems);
        socketService.emitUpdateItems(updatedItems);
      }
      return;
    }

    const overFolder = folders.find((folder) => folder.id === overId);
    if (overFolder && activeItem && activeItem.folderId !== overFolder.id) {
      const updatedItems = items.map((item) =>
        item.id === activeId ? { ...item, folderId: overFolder.id } : item
      );
      setItems(updatedItems);
      socketService.emitUpdateItems(updatedItems);
    }

    // Handle reordering within same context
    if (activeItem && overItem && activeItem.folderId === overItem.folderId) {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);

      const newItems = arrayMove(items, oldIndex, newIndex).map(
        (item, index) => ({ ...item, order: index })
      );
      setItems(newItems);
      socketService.emitUpdateItems(newItems);
    }

    // Handle folder reordering
    if (
      folders.find((f) => f.id === activeId) &&
      folders.find((f) => f.id === overId)
    ) {
      const oldIndex = folders.findIndex((f) => f.id === activeId);
      const newIndex = folders.findIndex((f) => f.id === overId);

      const newFolders = arrayMove(folders, oldIndex, newIndex);
      setFolders(newFolders);
      socketService.emitUpdateFolders(newFolders);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !iconFile) return;
    const id = crypto.randomUUID();
    const formData = new FormData();
    formData.append("title", newItemTitle);
    formData.append("icon", iconFile);
    formData.append("order", items.length.toString());
    formData.append("id", id);
    try {
      await createItem(formData);
      socketService.emitAddItem(id);
      setNewItemTitle("");
      setIconFile(null);
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder = {
      id: crypto.randomUUID(),
      name: newFolderName,
      isOpen: true,
      order: folders.length,
    };

    socketService.emitAddFolder(newFolder);
    setNewFolderName("");
  };

  return (
    <Container>
      <ControlPanel>
        <Form onSubmit={handleAddItem}>
          <Input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="New item title"
          />
          <FileInput
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={(e) => setIconFile(e.target.files?.[0] || null)}
          />
          <Button type="submit" disabled={!iconFile || !newItemTitle.trim()}>
            Add Item
          </Button>
        </Form>

        <Form onSubmit={handleAddFolder}>
          <Input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
          />
          <Button type="submit">Add Folder</Button>
        </Form>
      </ControlPanel>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={folders.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {folders
            .sort((a, b) => a.order - b.order)
            .map((folder) => (
              <DraggableFolder
                key={folder.id}
                {...folder}
                onToggle={() => {
                  const newFolders = folders.map((f) =>
                    f.id === folder.id ? { ...f, isOpen: !f.isOpen } : f
                  );
                  setFolders(newFolders);
                  socketService.emitUpdateFolders(newFolders);
                }}
              >
                <SortableContext
                  items={items
                    .filter((item) => item.folderId === folder.id)
                    .map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items
                    .filter((item) => item.folderId === folder.id)
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <DraggableItem key={item.id} {...item} />
                    ))}
                </SortableContext>
              </DraggableFolder>
            ))}
        </SortableContext>

        <DroppableRoot>
          <SortableContext
            items={items
              .filter((item) => !item.folderId)
              .map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items
              .filter((item) => !item.folderId)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <DraggableItem key={item.id} {...item} />
              ))}
          </SortableContext>
        </DroppableRoot>

        <DragOverlay>
          {activeItem ? <DraggableItem {...activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </Container>
  );
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const ControlPanel = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
`;

const Form = styled.form`
  display: flex;
  gap: 8px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #0051a2;
  }
`;

const FileInput = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export default App;
