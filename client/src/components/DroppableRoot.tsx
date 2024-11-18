import { useDroppable } from "@dnd-kit/core";
import styled from "@emotion/styled";

const DroppableRoot = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-container",
  });

  return (
    <StyledRoot ref={setNodeRef} $isOver={isOver}>
      {children}
    </StyledRoot>
  );
};

const StyledRoot = styled.div<{ $isOver: boolean }>`
  min-height: 100px;
  padding: 8px;
  border: 2px dashed ${(props) => (props.$isOver ? "#999" : "#ccc")};
  border-radius: 4px;
  margin-top: 16px;
  background: ${(props) => (props.$isOver ? "#f0f0f0" : "transparent")};
  transition: all 0.2s ease;

  &:empty {
    display: flex;
    align-items: center;
    justify-content: center;
    &:after {
      content: "Drop items here";
      color: #999;
    }
  }
`;

export default DroppableRoot;
