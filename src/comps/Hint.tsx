import { Button, Icon } from "@blueprintjs/core";
import { CSSProperties, useRef, useState } from "react";
import "./comp.less";

export function PageRefHint(props: {
  onClick: () => void;
  style: CSSProperties;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<number>();

  
  const handleMouseEnter = () => {
    // setIsHovered(true);
    clearTimeout(timerRef.current); 
    timerRef.current = setTimeout(() => {
      props.onClick();
    }, 300) as unknown as number;

  };
  
  const handleMouseLeave = () => {
    // setIsHovered(false);
    clearTimeout(timerRef.current);
  };
  
  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === 'hover-expand') {
      // 触发动画结束事件
      const customEvent = new CustomEvent('pageRefHintHoverEnd', {
        detail: { element: event.currentTarget }
      });
      event.currentTarget.dispatchEvent(customEvent);
      // props.onClick();
    }
  };

  return (
    <div
      style={props.style}
      onClickCapture={(e) => {
        props.onClick();
        e.stopPropagation();
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onAnimationEnd={handleAnimationEnd}
      className={`roam-ref-radar-hint ${isHovered ? 'hovered' : ''}`}
    />
  );
}

const EyeIcon = ({ className = "", strokeWidth = 1.5 }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8F99A8"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <g className="simple-state">
      <circle className="dot-l" cx="12" cy="12" r="1.5" />
      <circle className="dot-r" cx="12" cy="12" r="1.5" />
    </g>
    <g className="complex-state">
      <path className="bridge-arch" d="M5 12a7 7 0 0 1 14 0" />
    </g>
    {/* <g className="simple-state">
      <circle cx="5" cy="18" r="1.5"></circle>
      <circle cx="19" cy="6" r="1.5"></circle>
    </g>
    <g className="complex-state">
      <path d="M5 18c4-4 6-10 14-12"></path>
      <path
        className="leaf"
        
        d="M11 13l2-2"
      ></path>
    </g> */}
  </svg>
);

export default EyeIcon;
