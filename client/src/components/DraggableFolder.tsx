import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "@emotion/styled";
import { ReactNode } from "react";

interface DraggableFolderProps {
  id: string;
  name: string;
  isOpen: boolean;
  children: ReactNode;
  onToggle: () => void;
}

const DraggableFolder = ({
  id,
  name,
  isOpen,
  children,
  onToggle,
}: DraggableFolderProps) => {
  const {
    isOver,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <FolderContainer
      ref={setNodeRef}
      isDragging={isDragging}
      isOver={isOver}
      {...attributes}
      {...listeners}
      style={style}
    >
      <FolderHeader>
        <ToggleButton
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isOpen ? "▼" : "▶"}
        </ToggleButton>
        <span>{name}</span>
      </FolderHeader>
      {isOpen && <FolderContent>{children}</FolderContent>}
    </FolderContainer>
  );
};

const FolderContainer = styled.div<{ isDragging: boolean; isOver: boolean }>`
  margin: 4px 0;
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
  border: 1px solid ${(props) => (props.isOver ? "#0070f3" : "#eee")};
  cursor: move;
  user-select: none;
`;

const FolderHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
`;

const FolderContent = styled.div`
  padding-left: 20px;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

export default DraggableFolder;
