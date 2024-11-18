import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "@emotion/styled";

const DraggableFolder = ({ id, name, isOpen, children, onToggle }) => {
  const {
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
    <FolderContainer ref={setNodeRef} isDragging={isDragging}>
      <FolderHeader style={style} {...attributes} {...listeners}>
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

const FolderContainer = styled.div<{ isDragging: boolean }>`
  margin: 4px 0;
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
`;

const FolderHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  // background: #f5f5f5;
  border: 1px solid #eee;
  cursor: move;
  user-select: none;
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
