// src/components/Popover/Popover.js

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useReducer,
} from "react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  CollapsibleAnimator,
  createTopRightWaveAnimation,
  createWaveAnimation,
} from "./Wave";

let currentAnchorEl: HTMLElement | null = null;
// 鼠标或者点击或者悬浮 0.5 秒, 扩展动画会完成, 保持打开状态
// 其他情况会关闭扩展动画
export const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const forceUpdate = useReducer((p) => p + 1, 0)[1];

  const open = useCallback((target: HTMLElement) => {
    // event.currentTarget 是绑定了事件的元素
    setAnchorEl(target);
    if (currentAnchorEl === target) {
      currentAnchorEl = null;
    } else {
      currentAnchorEl = target;
    }
    forceUpdate();
  }, []);

  const close = useCallback(() => {
    currentAnchorEl = null;
    forceUpdate();
  }, []);

  const isOpen = Boolean(currentAnchorEl === anchorEl);
  // console.log({ isOpen });
  return {
    isOpen,
    open,
    close,
    // 传递给触发器的 props
    triggerProps: {
      onClick: open,
    },
    // 传递给 Popover 组件的 props
    popoverProps: {
      isOpen,
      anchorEl,
      onClose: close,
    },
  };
};

const el = document.createElement("div");
el.id = "popover-root";
if (!document.getElementById("popover-root")) {
  document.body.appendChild(el);
}

export const Popover = ({
  isOpen,
  anchorEl,
  onClose,
  children,
  // width = 250,
}: {
  isOpen: boolean;
  anchorEl: HTMLElement | null;
  onClose: (target?: Element) => void;
  children: React.ReactNode;
  width?: number;
}) => {
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [closed, setClosed] = useState(false);
  // 核心逻辑：计算位置
  useEffect(() => {
    if (anchorEl) {
      // 同步 anchorEl 的宽度和高度变化, 观察节点在页面上的位置变化
      const observer = new ResizeObserver(() => {
        const rect = anchorEl.getBoundingClientRect();
        setPosition({
          // 定位在锚点元素的右侧
          top: rect.y,
          left: rect.x - 4, // 在右侧留出 8px 间距
          width: rect.width + 2,
        });
      });
      observer.observe(anchorEl);

      const handleScroll = () => {
        // const rect = anchorEl.getBoundingClientRect();
        // setPosition({
        //   // 定位在锚点元素的右侧
        //   top: rect.y,
        //   left: rect.x - 4, // 在右侧留出 8px 间距
        //   width: rect.width + 2,
        // });
        onClose();
      };
      [".rm-article-wrapper", "#roam-right-sidebar-content"].forEach(
        (selector) => {
          document
            .querySelector(selector)
            ?.addEventListener("scroll", handleScroll);
        },
      );

      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        // 定位在锚点元素的右侧
        top: rect.y,
        left: rect.x - 4, // 在右侧留出 8px 间距
        width: rect.width + 2,
      });
      return () => {
        observer.disconnect();
        [".rm-article-wrapper", "#roam-right-sidebar-content"].forEach(
          (selector) => {
            document
              .querySelector(selector)
              ?.removeEventListener("scroll", handleScroll);
          },
        );
      };
    }
  }, [anchorEl, isOpen]); // 当锚点或打开状态变化时重新计算

  // 处理点击外部关闭 和 Esc 键关闭
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      // 如果点击在 popover 外部，则关闭
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        !(event.target as HTMLElement).closest(".roam-ref-radar-menu")
        // &&
        // !(event.target as HTMLElement).closest(".roam-ref-radar")
      ) {
        console.log(` mouse down `, event.target);
        onClose(event.target as HTMLElement);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        console.log(` keydown `, event);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={popoverRef}
      className={`popover-panel ${isOpen ? "open" : ""}`}
      style={{
        ...position,
      }}
    >
      <CollapsibleAnimator
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setClosed(true);
        }}
        animationStrategy={createTopRightWaveAnimation({
          isOpen,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          duration: 500,
        })}
        // onClose={function (): void {
        //   // throw new Error("Function not implemented.");
        //   onClose();
        // }}
        // {...position}
      >
        {children}
      </CollapsibleAnimator>
    </div>
    // popoverRoot,
  );
};
