import { Element, Processor } from "@frontity/html2react/types";
import { css } from "frontity";

const radiusRegExp = /^has-border-radius-(\w+)$/;

export const borderRadius: Processor<Element> = {
  name: "border-radius",
  test: ({ node }) =>
    node.type === "element" &&
    node.props.className &&
    node.props.className.split(" ").some((name) => radiusRegExp.test(name)),
  processor: ({ node }) => {
    // Get border-radius class
    const radiusClass = node.props.className
      .split(" ")
      .find((name) => radiusRegExp.test(name));

    // Get value of radius
    const [, radius] = radiusClass.match(radiusRegExp);

    return {
      ...node,
      props: {
        ...node.props,
        css: css`
          ${node.props.css}
          border-radius: ${radius};
        `,
      },
    };
  },
};
