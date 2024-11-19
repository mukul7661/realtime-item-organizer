import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "@emotion/styled";
import { useState } from "react";

interface DraggableItemProps {
  id: string;
  title: string;
  icon: string;
  isActive?: boolean;
}

const DraggableItem = ({ id, title, icon }: DraggableItemProps) => {
  const [imageError, setImageError] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "item",
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <ItemContainer
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <IconWrapper>
        {imageError ? (
          <FallbackIcon>📄</FallbackIcon>
        ) : (
          <IconImage
            src={icon}
            alt={title}
            onError={() => setImageError(true)}
          />
        )}
      </IconWrapper>
      <span>{title}</span>
    </ItemContainer>
  );
};

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #eee;
  margin: 4px 0;
  cursor: move;
  user-select: none;
  touch-action: none;
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const FallbackIcon = styled.span`
  font-size: 20px;
`;

export default DraggableItem;
