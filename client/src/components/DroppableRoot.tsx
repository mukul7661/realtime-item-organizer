import { useDroppable } from "@dnd-kit/core";
import styled from "@emotion/styled";

const DroppableRoot = ({ children }: { children: React.ReactNode }) => {
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
  border: 1px solid ${(props) => (props.$isOver ? "#0070f3" : "#eee")};
  min-height: 100px;
  padding: 8px;
  border-radius: 4px;
  margin-top: 16px;
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
