import { connect, styled } from "frontity";
import { Connect } from "frontity/types";
import React from "react";

import FrontityOrg from "../../types";
import { addAlpha } from "../utils";
import Arrow from "./icons/arrow";

const Dropdown: React.FC<Connect<
  FrontityOrg,
  {
    className?: string;
  }
>> = ({ className, children, state }) => {
  // Define the inner state.
  const [isOpen, setOpen] = React.useState(false);

  // Get rendered `button` and `content` from `children`.
  const [button, content] = React.Children.toArray(children);

  // Get colors from the state.
  const separatorColor = addAlpha(state.theme.colors.primary, 0.08);

  /**
   * Get a reference to Content to pass it to AnimatedContent
   * and retrieve its height later.
   *
   * The transition uses `max-height` and that needs a value in pixels.
   */
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    /**
     * Pass down `className` prop to keep styles
     * added by processors and gutenberg classes.
     */
    <Container className={className}>
      <Button onClick={() => setOpen(!isOpen)}>
        {button}
        <IconContainer isOpen={isOpen}>
          <Arrow />
        </IconContainer>
      </Button>
      <AnimatedContent isOpen={isOpen} contentRef={contentRef}>
        <Content ref={contentRef} separatorColor={separatorColor}>
          {content}
        </Content>
      </AnimatedContent>
    </Container>
  );
};

export default connect(Dropdown);

const Container = styled.div`
  cursor: pointer;

  /* Use a more specific selector to change margin and padding */
  &.wp-block-group.has-background {
    padding: 0;
  }
`;

const Button = styled.div`
  min-height: 48px;
  box-sizing: border-box;
  padding: 12px 24px 12px 20px;

  /* Place inner elements in a row */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const IconContainer = styled.div<{ isOpen: boolean }>`
  /* Do not resize icon (it's inside a flex container) */
  flex: 0 0 auto;
  width: auto;
  height: 24px;
  margin-left: 16px;

  /* Center the icon */
  display: flex;
  justify-content: center;
  align-items: center;

  /* Rotate the icon if the dropdown is open */
  transform: rotate(${({ isOpen }) => (isOpen ? 180 : 0)}deg);
  transition: transform 0.3s;
`;

const AnimatedContent = styled.div<{
  isOpen: boolean;
  contentRef: React.RefObject<HTMLDivElement>;
}>`
  /* Animate content */
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${({ isOpen, contentRef }) =>
    isOpen ? contentRef.current.offsetHeight : 0}px;
`;

const Content = styled.div<{
  separatorColor: string;
}>`
  box-sizing: border-box;
  padding: 12px 0 16px 0;
  margin: 0 20px;

  /* Draw a separator line */
  border-top: 2px solid ${({ separatorColor }) => separatorColor};
`;
