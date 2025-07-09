// src/hooks/useKeyframes.js
import { useEffect } from "react";

// 这个 Hook 负责将一个 keyframes 样式字符串注入到文档的 <head> 中
const useKeyframes = (keyframes: string, id: string) => {
  useEffect(() => {
    // 防止重复注入
    if (document.getElementById(id)) {
      return;
    }

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = keyframes;
    document.head.appendChild(style);

    // 组件卸载时移除 style 标签
    return () => {
      const styleTag = document.getElementById(id);
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
    };
  }, [keyframes, id]);
};

export default useKeyframes;
