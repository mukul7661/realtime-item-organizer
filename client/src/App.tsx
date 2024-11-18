import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { io } from "socket.io-client";
import styled from "@emotion/styled";
import DraggableItem from "./components/DraggableItem";
import DraggableFolder from "./components/DraggableFolder";
import DroppableRoot from "./components/DroppableRoot";

const socket = io("http://localhost:3001");

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  console.log(items);

  useEffect(() => {
    socket.on("updateState", ({ items, folders }) => {
      setItems(items);
      setFolders(folders);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeItem = items.find((item) => item.id === activeId);
    if (!activeItem) return;

    const overFolder = folders.find((folder) => folder.id === overId);
    if (!overFolder) return;

    if (activeItem.folderId !== overFolder.id) {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newItems = [...items];
      newItems[oldIndex] = { ...activeItem, folderId: overFolder.id };
      setItems(newItems);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeItem = items.find((item) => item.id === activeId);
    const overItem = items.find((item) => item.id === overId);

    if (overId === "root-container") {
      if (activeItem.folderId !== null) {
        const updatedItems = items.map((item) =>
          item.id === activeId ? { ...item, folderId: null } : item
        );
        setItems(updatedItems);
        socket.emit("updateItems", updatedItems);
      }
      return;
    }

    const overFolder = folders.find((folder) => folder.id === overId);
    console.log(overFolder);
    if (overFolder && activeItem.folderId !== overFolder.id) {
      const updatedItems = items.map((item) =>
        item.id === activeId ? { ...item, folderId: overFolder.id } : item
      );
      setItems(updatedItems);
      socket.emit("updateItems", updatedItems);
    }

    // Handle reordering within same context
    if (activeItem && overItem && activeItem.folderId === overItem.folderId) {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);

      const newItems = arrayMove(items, oldIndex, newIndex).map(
        (item, index) => ({ ...item, order: index })
      );
      setItems(newItems);
      socket.emit("updateItems", newItems);
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
      socket.emit("updateFolders", newFolders);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: crypto.randomUUID(),
      title: newItemTitle,
      icon: "📄",
      folderId: null,
      order: items.length,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    socket.emit("updateItems", updatedItems);
    setNewItemTitle("");
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

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    socket.emit("updateFolders", updatedFolders);
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
          <Button type="submit">Add Item</Button>
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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={folders.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {folders
            // .sort((a, b) => a.order - b.order)
            .map((folder) => (
              <DraggableFolder
                key={folder.id}
                {...folder}
                onToggle={() => {
                  const newFolders = folders.map((f) =>
                    f.id === folder.id ? { ...f, isOpen: !f.isOpen } : f
                  );
                  setFolders(newFolders);
                  socket.emit("updateFolders", newFolders);
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

export default App;
