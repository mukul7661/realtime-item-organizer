import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "@emotion/styled";

const DraggableItem = ({ id, title, icon, isActive }) => {
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
    opacity: isDragging ? 0.5 : 1,
    // backgroundColor: isDragging ? "#f0f0f0" : "white",
    position: "relative",
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <ItemContainer
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <span>{icon}</span>
      <span>{title}</span>
    </ItemContainer>
  );
};

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  // background: white;
  border: 1px solid #eee;
  margin: 4px 0;
  cursor: move;
  user-select: none;
  touch-action: none;
`;

export default DraggableItem;
