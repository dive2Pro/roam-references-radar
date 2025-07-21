import { extension_helper } from "./helper";
import {
  onBlockInputChildrenChange,
  onElementIntersection,
} from "./comps/KeywordRadar";

/**
 * 辅助函数：判断两个关键词的范围是否重叠 (无变化)
 * @param kw1 第一个关键词对象
 * @param kw2 第二个关键词对象
 * @returns 如果重叠则返回 true，否则返回 false
 */
function doRangesOverlap(kw1: Keyword, kw2: Keyword): boolean {
  return kw1.startIndex <= kw2.endIndex && kw2.startIndex <= kw1.endIndex;
}

/**
 * 将重叠的关键词分组，并计算每组的整体范围及其对应的文本
 * @param keywords 关键词对象数组
 * @param sourceText 关键词所在的原始文本
 * @returns 包含分组信息、范围和文本的数组
 */
export function groupKeywordsWithText(
  keywords: Keyword[],
  sourceText: string
): GroupedResultWithText[] {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  const result: GroupedResultWithText[] = [];
  const visited = new Set<Keyword>();

  for (const keyword of keywords) {
    if (visited.has(keyword)) {
      continue;
    }

    // Step 1: 使用 BFS 找到所有重叠的关键词，形成一个组
    const currentGroup: Keyword[] = [];
    const queue: Keyword[] = [keyword];
    visited.add(keyword);

    while (queue.length > 0) {
      const currentKeyword = queue.shift()!;
      currentGroup.push(currentKeyword);

      for (const otherKeyword of keywords) {
        if (
          !visited.has(otherKeyword) &&
          doRangesOverlap(currentKeyword, otherKeyword)
        ) {
          visited.add(otherKeyword);
          queue.push(otherKeyword);
        }
      }
    }

    if (currentGroup.length > 0) {
      // Step 2: 计算该组的整体 start 和 end
      const minStart = Math.min(...currentGroup.map((k) => k.startIndex));
      const maxEnd = Math.max(...currentGroup.map((k) => k.endIndex));

      // Step 3: 根据 start 和 end 从原始文本中截取字符串
      // String.slice(start, end) 截取的是 [start, end) 区间，不包含 end 索引
      // 因为我们的 endIndex 是包含的，所以需要 +1
      const text = sourceText.slice(minStart, maxEnd + 1);

      // Step 4: 将包含范围和文本的结果对象添加到最终结果中
      result.push({
        keywords: currentGroup,
        start: minStart,
        end: maxEnd,
        text: text,
      });
    }
  }

  return result;
}

extension_helper.on_uninstall(() => {
  document.querySelectorAll(".roam-ref-radar").forEach((div) => div.remove());
});

const BLOCK_INPUT_QUERY = "div[id^=block-input]";

function init() {
  // --- 步骤 1: 设置 IntersectionObserver ---
  // 这个 Observer 将被用来观察所有动态添加的卡片
  const intersectionCallback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      // if (entry.isIntersecting) {
      //   // entry.target.classList.add("is-visible");
      //   domSet.add(entry.target);
      // } else {
      //   // 可选：如果元素离开视口需要恢复状态，可以在这里处理
      //   domSet.delete(entry.target);
      // }
      onElementIntersection(entry);
    });
    // triggerModifyDom();
  };

  // 创建一个全局的 IntersectionObserver 实例
  const intersectionObserver = new IntersectionObserver(intersectionCallback, {
    threshold: 0.1, // 元素可见 10% 时触发
  });

  const allDiv = [...document.querySelectorAll(`div[id^=block-input]`)];
  allDiv.forEach((div) => {
    intersectionObserver.observe(div);
  });
  // --- 步骤 2: 设置 MutationObserver ---
  // 这个 Observer 监视容器的子元素变化
  const container = document.querySelector(".roam-app");

  const mutationCallback: MutationCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        // --- 处理新增的节点 ---
        mutation.addedNodes.forEach((_node) => {
          const node = _node as Element;
          // 我们只关心元素节点
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          // 如果新增的节点属于 block-input 的子孙, 触发该节点更新
          if (!!node.closest(BLOCK_INPUT_QUERY)) {
            // domSet.add(node.closest(BLOCK_INPUT_QUERY));
            // triggerModifyDom();
            onBlockInputChildrenChange(node.closest(BLOCK_INPUT_QUERY));
          }

          if (node.matches(BLOCK_INPUT_QUERY)) {
            console.log("➕ 检测到直接卡片, 开始观察:", node);
            intersectionObserver.observe(node);
          }

          // 检查被添加的节点内部是否包含目标卡片 (处理嵌套情况)
          const nestedCards = node.querySelectorAll(BLOCK_INPUT_QUERY);
          nestedCards.forEach((card) => {
            console.log("➕ 检测到嵌套卡片, 开始观察:", card);
            intersectionObserver.observe(card);
          });
        });

        // --- 处理移除的节点 ---
        mutation.removedNodes.forEach((_node) => {
          const node = _node as Element;
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches(BLOCK_INPUT_QUERY)) {
            console.log("➖ 移除直接 block-input, 停止观察:", node);
            intersectionObserver.unobserve(node);
          }

          const nestedCards = node.querySelectorAll(BLOCK_INPUT_QUERY);
          nestedCards.forEach((card) => {
            console.log("➖ 移除嵌套block-input, 停止观察:", card);
            intersectionObserver.unobserve(card);
          });
        });
      }
    }
  };

  // 创建 MutationObserver 实例
  const mutationObserver = new MutationObserver(mutationCallback);

  // 配置 MutationObserver
  const config = {
    childList: true, // 监视子节点的添加或删除
    subtree: true, // 如果子节点内部还有变化需要监听，则设为 true
  };

  // 开始监视目标容器
  mutationObserver.observe(container, config);
  extension_helper.on_uninstall(() => {
    mutationObserver.disconnect();
    intersectionObserver.disconnect();
  });
}

export function initExtension(extensionAPI: ExtensionAPI) {
  init();
  
}
