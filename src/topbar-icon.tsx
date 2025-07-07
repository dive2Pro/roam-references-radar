import { Button, Icon, Menu, Popover, MenuItem } from "@blueprintjs/core";
import { ReactNode } from "react";
import ReactDom from "react-dom";
import { AhoCorasick } from "./AhoCorasick";

import { appendToTopbar, extension_helper } from "./helper";
import { Popover as GlobalPopover, usePopover } from "./globalExpander";

type QueryBlock = {
  string: string;
  uid: string;
  title: string;
  parents: QueryBlock[];
  page: {
    title: string;
    uid: string;
    time: string;
  };
  refs: {
    title: string;
  }[];
  children: QueryBlock[];
  "create-time": number;
  "edit-time": number;
};

const newAhoCorasick = async () => {
  const allPages = (
    (await window.roamAlphaAPI.data.async.fast.q(`
      [
        :find (pull ?page [:block/uid :node/title])
        :where
          [?page :node/title ]

      ]
      `)) as { ":block/uid": string; ":node/title": string }[][]
  )
    .map((item) => item[0])
    .filter((page) => page[":node/title"].length > 2);
  const ac = new AhoCorasick(allPages.map((page) => page[":node/title"]));
  return ac;
};

const getData = async () => {
  console.time("DO");

  const getBlocksWithElements = () => {
    const allDiv = [...document.querySelectorAll(`div[id^=block-input]`)];

    const elementUidMap = allDiv.reduce(
      (p, div) => {
        const uid = div.id.substring(
          div.id.lastIndexOf("-", div.id.length - 10) + 1,
        );
        p[uid] = {
          uid,
          div: div as HTMLElement,
        };
        return p;
      },
      {} as Record<string, { uid: string; div: HTMLElement }>,
    );
    return elementUidMap;
  };
  const elementUidMap = getBlocksWithElements();
  const getAllBlocks = async () => {
    const uids = Object.keys(elementUidMap);
    const blocks = await window.roamAlphaAPI.data.async.pull_many(
      "[:block/string :block/uid]",
      uids.map((uid) => [":block/uid", uid]),
    );
    return blocks;
  };
  const allBlocks = await getAllBlocks();

  const ac = await newAhoCorasick();

  const result = allBlocks
    .filter((block) => block?.[":block/string"])
    .map((block, index) => {
      if (!block) {
        console.log({ block, index }, allBlocks);
        throw new Error("Block is undefined");
      }

      const blockAcResult = ac.search(block[":block/string"]);
      return {
        block,
        blockAcResult,
        ...elementUidMap[block[":block/uid"]],
      };
    })
    .filter((block) => block.blockAcResult.length);
  console.timeEnd("DO");

  console.log({ result });

  return result;
};

// 页面上有变化的时候呢?

/**
 * 关键词数据接口 (无变化)
 */
interface Keyword {
  keyword: string;
  startIndex: number;
  endIndex: number; // 假设 endIndex 是包含的 (inclusive)
}

/**
 * 分组后的结果接口 (新增 text 字段)
 */
interface GroupedResultWithText {
  keywords: Keyword[];
  start: number;
  end: number;
  text: string; // 从原始文本中截取的、代表整个分组范围的字符串
}
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
  sourceText: string,
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

function KeywordRadar({
  data,
}: {
  data: {
    block: PullBlock;
    blockAcResult: {
      keyword: string;
      startIndex: number;
      endIndex: number;
    }[];
    div: HTMLElement;
  };
}) {
  const popover = usePopover();

  const contents: ReactNode[] = [];
  let startIndex = 0;
  const blockString = data.block[":block/string"];
  const groupKeywords = groupKeywordsWithText(
    data.blockAcResult,
    data.block[":block/string"],
  );
  // 找出重叠的
  groupKeywords.forEach((acResultItem) => {
    contents.push(blockString.substring(startIndex, acResultItem.start));
    startIndex = acResultItem.end + 1;
    contents.push(<BlockKeyword {...acResultItem} />);
  });
  contents.push(blockString.substring(startIndex));

  return (
    <div>
      <Icon
        onClick={() => {
          console.log(` open global`, data);
          popover.triggerProps.onClick(data.div);
        }}
        icon="star"
      ></Icon>
      <GlobalPopover {...popover.popoverProps}>
        <div className="roam-block">{contents}</div>
      </GlobalPopover>
    </div>
  );
}

function BlockKeyword({ text, keywords }: GroupedResultWithText) {
  return (
    // @ts-ignore
    <Popover
      // interactionKind="hover"
      autoFocus={false}
      popoverClassName="roam-ref-radar-popover"
      content={
        <Menu className="roam-ref-radar-menu">
          {/* <MenuItem
            text="Open in sidebar"
            icon="add-column-right"
            onClick={() => {
              window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: {
                  type: "block",
                  "block-uid": window.roamAlphaAPI.data.q(`
                    [
                      :find ?e .
                      :where
                        [?p :node/title "here"]
                        [?p :block/uid ?e]
                    ]
                    `) as unknown as string,
                },
              });
            }}
          />
          <MenuItem
            text="Open linked references"
            icon="add-column-right"
            onClick={() => {
              window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: {
                  type: "mentions",
                  "block-uid": window.roamAlphaAPI.data.q(`
                  [
                    :find ?e .
                    :where
                      [?p :node/title "here"]
                      [?p :block/uid ?e]
                  ]
                  `) as unknown as string,
                },
              });
            }}
          /> */}
          {keywords.map((keywordItem) => {
            return (
              <MenuItem
                text={`[[${keywordItem.keyword}]]`}
                icon="new-link"
                onClick={() => {
                  /**
                   * 1. 更新数据源
                   * 2. 更新当前组件
                   * 3. 关闭弹窗
                   */
                }}
              />
            );
          })}
        </Menu>
      }
    >
      <span className="block-keyword">{text}</span>
    </Popover>
  );
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(null, args);
      timeoutId = null;
    }, wait);
  };
}

const domSet = new WeakSet<Element>();

const triggerModifyDom = debounce(async () => {
  const getBlocksWithElements = () => {
    const allDiv = [...document.querySelectorAll(`div[id^=block-input]`)];

    const elementUidMap = allDiv
      .filter((queryDiv) => {
        return domSet.has(queryDiv);
      })
      .reduce(
        (p, div) => {
          const uid = div.id.substring(
            div.id.lastIndexOf("-", div.id.length - 10) + 1,
          );
          p[uid] = {
            uid,
            div: div as HTMLElement,
          };
          return p;
        },
        {} as Record<string, { uid: string; div: HTMLElement }>,
      );
    return elementUidMap;
  };
  const elementUidMap = getBlocksWithElements();
  const getAllBlocks = async () => {
    const uids = Object.keys(elementUidMap);
    const blocks = await window.roamAlphaAPI.data.async.pull_many(
      "[:block/string :block/uid]",
      uids.map((uid) => [":block/uid", uid]),
    );
    return blocks;
  };
  const allBlocks = await getAllBlocks();

  const ac = await newAhoCorasick();

  const result = allBlocks
    .filter((block) => block?.[":block/string"])
    .map((block, index) => {
      if (!block) {
        console.log({ block, index }, allBlocks);
        throw new Error("Block is undefined");
      }

      const blockAcResult = ac.search(block[":block/string"]);
      return {
        block,
        blockAcResult,
        ...elementUidMap[block[":block/uid"]],
      };
    })
    .filter((block) => block.blockAcResult.length);

  result.forEach((item) => {
    let el = item.div.parentElement.querySelector(".roam-ref-radar");
    if (el) {
      ReactDom.render(<KeywordRadar data={item} />, el);
    } else {
      const div = document.createElement("div");
      item.div.insertAdjacentElement("afterend", div);
      div.className = "roam-ref-radar";
      ReactDom.render(<KeywordRadar data={item} />, div);
    }
  });
  console.log(elementUidMap, " ---- right ?");
}, 500);

extension_helper.on_uninstall(() => {
  document.querySelectorAll(".roam-ref-radar").forEach((div) => div.remove());
});

function init() {
  // --- 步骤 1: 设置 IntersectionObserver ---
  // 这个 Observer 将被用来观察所有动态添加的卡片
  const intersectionCallback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // entry.target.classList.add("is-visible");
        domSet.add(entry.target);
      } else {
        // 可选：如果元素离开视口需要恢复状态，可以在这里处理
        // console.log("❌ 元素离开视口:", entry.target);
        // entry.target.classList.remove('is-visible');
        domSet.delete(entry.target);
      }
    });
    triggerModifyDom();
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

          // 检查被添加的节点本身是否是目标卡片
          if (node.matches("div[id^=block-input]")) {
            console.log("➕ 检测到直接卡片, 开始观察:", node);
            intersectionObserver.observe(node);
          }

          // 检查被添加的节点内部是否包含目标卡片 (处理嵌套情况)
          const nestedCards = node.querySelectorAll("div[id^=block-input]");
          nestedCards.forEach((card) => {
            console.log("➕ 检测到嵌套卡片, 开始观察:", card);
            intersectionObserver.observe(card);
          });
        });

        // --- 处理移除的节点 ---
        mutation.removedNodes.forEach((_node) => {
          const node = _node as Element;
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.matches("div[id^=block-input]")) {
            console.log("➖ 移除直接 block-input, 停止观察:", node);
            intersectionObserver.unobserve(node);
          }

          const nestedCards = node.querySelectorAll("div[id^=block-input]");
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
}

function TopbarIcon() {
  return (
    <>
      <Button
        icon="add"
        onClick={() => {
          // takeAll();
          init();
        }}
      />
    </>
  );
}

export function initTopbarIcon(extensionAPI: ExtensionAPI) {
  const topbarIcon = appendToTopbar("Extension-Name");
  ReactDom.render(<TopbarIcon />, topbarIcon);
  extension_helper.on_uninstall(() => {
    topbarIcon.parentElement.removeChild(topbarIcon);
  });
}
