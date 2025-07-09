// src/components/WaveCollapsible.jsx
import React, {
  useState,
  useRef,
  useLayoutEffect,
  ReactNode,
  CSSProperties,
  useEffect,
} from "react";
import ReactDOM from "react-dom";
import useKeyframes from "./useKeyframes";

const subtleWaveKeyframes = `
  @keyframes subtle-wave {
    0%, 100% {
      transform: skewX(-1deg) scale(1.005);
    }
    50% {
      transform: skewX(1deg) scale(0.995);
    }
  }
`;

/**
 * 波浪动画策略生成器
 * @param {object} options
 * @param {boolean} options.isOpen - 组件是否展开
 * @param {number} options.duration - 动画时长
 * @param {string} options.easing - 动画曲线
 * @returns {object} 包含 style 和 keyframes 的动画配置
 */
export const createWaveAnimation = ({
  isOpen,
  duration,
  easing,
}: {
  isOpen: boolean;
  duration: number;
  easing: string;
}) => {
  const style = {
    // 【核心动画逻辑】
    transition: `clip-path ${duration}ms ${easing}, opacity ${duration * 0.5}ms linear`,
    clipPath: isOpen
      ? "ellipse(150% 150% at 0% 0%)" // 从左上角展开
      : "ellipse(0% 0% at 0% 0%)", // 在左上角收起
    opacity: isOpen ? 1 : 0,
    animation: isOpen ? `subtle-wave 6s ${easing} infinite` : "none",
    animationDelay: `${duration}ms`,
  };

  const keyframes = {
    id: "subtle-wave-animation",
    definition: subtleWaveKeyframes,
  };

  return { style, keyframes };
};

/**
 * 一个通用的、可注入动画策略的伸缩组件
 */
export const CollapsibleAnimator = ({
  children,
  animationStrategy, // 【核心】: 接收一个动画策略函数
  duration = 700,
  onClose,
  isOpen,
  easing = "cubic-bezier(0.25, 1, 0.5, 1)",
}: {
  onClose: () => void;
  isOpen: boolean;
  children: ReactNode;
  animationStrategy: any;
  duration?: number;
  easing?: string;
}) => {
  const contentRef = useRef(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  // 【核心】: 调用策略函数，获取动画配置
  const animation = animationStrategy;

  // 如果策略返回了 keyframes，就注入它们
  if (animation.keyframes) {
    useKeyframes(animation.keyframes.definition, animation.keyframes.id);
  }

  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentSize({
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight,
      });
    }
  }, [children]);

  // --- 布局逻辑 (这部分保持不变) ---
  const containerStyle: CSSProperties = {
    position: "relative",
    paddingTop: "40px",
    paddingLeft: "40px",
  };
  // --- 布局逻辑结束 ---

  // 【核心】: 将策略生成的样式应用到内容包装器上
  const contentWrapperStyle = {
    minWidth: `${contentSize.width}px`,
    minHeight: `${contentSize.height}px`,
    ...animation.style, // 应用注入的动画样式
  };

  return (
    <div style={containerStyle}>
      <div style={contentWrapperStyle}>
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
};

/**
 * 【新】从右上角展开的波浪动画策略
 * @param {object} options
 * @param {boolean} options.isOpen - 组件是否展开
 * @param {number} options.duration - 动画时长
 * @param {string} options.easing - 动画曲线
 * @returns {object} 包含布局、动画样式和 keyframes 的完整配置
 */
export const createTopRightWaveAnimation = ({
  isOpen,
  duration,
  easing,
}: {
  isOpen: boolean;
  duration: number;
  easing: string;
}) => {
  // 1. 定义布局样式
  const layout = {
    container: {
      position: "relative",
      paddingTop: "40px",
      paddingRight: "40px", // 从右上角开始，所以是 right padding
    },
    trigger: {
      position: "absolute",
      top: 0,
      right: 0, // 定位到右上角
      cursor: "pointer",
      userSelect: "none",
      zIndex: 2,
    },
  };

  // 2. 定义动画样式
  const animation = {
    style: {
      transition: `clip-path ${duration}ms ${easing}, opacity ${duration * 0.5}ms linear`,

      // 【核心修改】: 改变 clip-path 的中心点
      clipPath: isOpen
        ? "ellipse(150% 150% at 100% 0%)" // 展开: 椭圆中心在右上角
        : "ellipse(0% 0% at 100% 0%)", // 收起: 在右上角的一个点

      opacity: isOpen ? 1 : 0,
      animation: isOpen ? `subtle-wave 6s ${easing} infinite` : "none",
      animationDelay: `${duration}ms`,
    },
    keyframes: {
      id: "subtle-wave-animation",
      definition: subtleWaveKeyframes,
    },
  };

  // 返回一个包含所有配置的对象
  return { layout, animation };
};
