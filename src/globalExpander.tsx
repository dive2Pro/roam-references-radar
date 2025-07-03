// src/components/Popover/Popover.js

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const open = useCallback((target: HTMLElement) => {
    // event.currentTarget 是绑定了事件的元素
    setAnchorEl(target);
  }, []);

  const close = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const isOpen = Boolean(anchorEl);

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

const popoverRoot = document.getElementById("popover-root");

export const Popover = ({
  isOpen,
  anchorEl,
  onClose,
  children,
  // width = 250,
}: {
  isOpen: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) => {
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // 核心逻辑：计算位置
  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      console.log({ rect, anchorEl });
      setPosition({
        // 定位在锚点元素的右侧
        top: rect.y,
        left: rect.x - 4, // 在右侧留出 8px 间距
        width: rect.width + 2,
      });
    }
  }, [anchorEl, isOpen]); // 当锚点或打开状态变化时重新计算

  // 处理点击外部关闭 和 Esc 键关闭
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      // 如果点击在 popover 外部，则关闭
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className={`popover-panel ${isOpen ? "open" : ""}`}
      style={{
        ...position,
      }}
    >
      {children}
    </div>,
    popoverRoot,
  );
};
