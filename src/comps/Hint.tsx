import { Button, Icon } from "@blueprintjs/core";
import { CSSProperties, useRef, useState } from "react";
import "./comp.less";
 
export function PageRefHint(props: {
  onClick: () => void;
  style: CSSProperties;
}) {
  // return (
  //   <Icon
  //     className="radar-icon"
  //     icon={"sensor"}
  //     color="#8F99A8"
  //     onClick={props.onClick}
  //   />
  // );
  // return <span className="rm-icon-key-prompt radar-icon" onClick={props.onClick}></span>;
  // return <HintIcon type="quantumLink" size={18} />
  return <Button icon={<EyeIcon />} onClick={props.onClick} id="bridge" minimal small />;
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
