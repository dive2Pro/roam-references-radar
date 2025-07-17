import { Icon, Popover } from "@blueprintjs/core";
import React, { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Match } from "../AhoCorasick";
import { AC, newAhoCorasick } from "../allPageSearchEngine";
import { usePopover } from "../globalExpander";
import { groupKeywordsWithText } from "../topbar-icon";
import { debounce } from "../utils";
import { BlockKeyword } from "./BlockKeyword";
import { PageRefHint } from "./Hint";

// 1. 每次进入视口中的 block , 雷达扫描一次.
// 2. 撤销和反撤销, 根据影响到的 div , 触发雷达扫描
// 3. 每次扫描后, 如果 popover 是打开的, 只更新内容, 并不关闭

type ObserverParams = {
  uid: string;
  div: HTMLElement;
  block: PullBlock;
  blockAcResult: Match[];
};
class Observers {
  listeners: Record<string, ((params: ObserverParams) => void)[]> = {};

  add(id: string, listener: (params: ObserverParams) => void) {
    if (!this.listeners[id]) {
      this.listeners[id] = [];
    }
    const index = this.listeners[id].push(listener) - 1;

    return () => {
      this.listeners[id].splice(index, 1);
    };
  }

  emit(id: string, data: ObserverParams) {
    if (this.listeners[id]) {
      this.listeners[id].forEach((callbackFn) => {
        callbackFn(data);
      });
    }
  }
}

const observers = new Observers();

function KeywordRadar({
  data,
  uninstall,
  el,
}: {
  uninstall: () => void;
  data: {
    block: PullBlock;
    blockAcResult: {
      keyword: string;
      startIndex: number;
      endIndex: number;
    }[];
    div: HTMLElement;
  };
  el: HTMLElement;
}) {
  const popover = usePopover();
  const [blockString, setBlockString] = useState(data.block[":block/string"]);
  // const blockString = data.block[":block/string"];
  const [blockAcResult, setBlockAcResult] = useState(data.blockAcResult);
  // const blockAcResult = data.blockAcResult;
  const contents: ReactNode[] = [];
  let startIndex = 0;
  useEffect(() => {
    return observers.add(data.block[":block/uid"], (params) => {
      setBlockString(params.block[":block/string"]);
      setBlockAcResult(params.blockAcResult);
    });
  }, []);
  // const blockString = data.block[":block/string"];
  const groupKeywords = groupKeywordsWithText(blockAcResult, blockString);
  // 找出重叠的
  groupKeywords.forEach((acResultItem) => {
    contents.push(blockString.substring(startIndex, acResultItem.start));
    startIndex = acResultItem.end + 1;
    contents.push(
      <BlockKeyword
        data={acResultItem}
        key={`${acResultItem.start}-${acResultItem.end}-${acResultItem.text}`}
        blockString={blockString}
        uid={data.block[":block/uid"]}
        onChange={(text) => {
          // setBlockString(text);
          // console.log({ acResultItem }, text);
          // setBlockAcResult(AC.search(text));
          // triggerModifyDom();
        }}
      />
    );
  });
  contents.push(blockString.substring(startIndex));
  // console.log({ groupKeywords, blockString, contents }, " ____");

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // console.log({ blockAcResult, isPopoverOpen });
  if (!blockAcResult.length) {
    setIsPopoverOpen(false);
    uninstall();
    return null;
  }
  const rect = data.div.getBoundingClientRect();
  // el.style.width = rect.width + "px";
  // el.style.left = 40 + "px";
  // console.log({ rect }, el);
  return (
    <>
      {/* @ts-ignore */}
      <Popover
        position="left"
        // position="top"
        content={
          <div
            className="roam-block"
            style={{
              width: rect.width - 10,
              // top: rect.top,
              paddingLeft: 10,
              height: rect.height,
              // left: rect.left + 20,
            }}
          >
            {contents}
          </div>
        }
        isOpen={isPopoverOpen}
        onClose={() => {
          setIsPopoverOpen(false);
        }}
      >
        <PageRefHint
          style={{
            width: rect.width,
            // top: rect.top,
            // height: rect.height,
            // left: rect.left,
            top: 20,
          }}
          onClick={() => {
            console.log(` open global`, data, popover);
            // popover.triggerProps.onClick(data.div);
            // e.preventDefault();
            setIsPopoverOpen(true);
            // e.stopPropagation();
          }}
        ></PageRefHint>
      </Popover>
    </>
  );
}

export function rescan() {}

export function renderRadar(data: any, el: Element) {
  // console.log({ data, el });
  ReactDOM.render(
    <KeywordRadar
      // key={item.block[":block/string"]}
      uninstall={() => el.remove()}
      data={data}
      el={el as HTMLElement}
    />,
    el
  );
}

export function onElementIntersection(entry: IntersectionObserverEntry) {
  if (entry.isIntersecting) {
    domSet.add(entry.target);
  } else {
    domSet.delete(entry.target);
  }
  requestIdleCallback(() => {
    triggerModifyDom();
  });
}

export function onBlockInputChildrenChange(blockInputElement: Element) {
  domSet.add(blockInputElement);
  requestIdleCallback(() => {
    triggerModifyDom();
  });
}

const domSet = new WeakSet<Element>();

const triggerModifyDom = debounce(async () => {
  const getBlocksWithElements = () => {
    const allDiv = [...document.querySelectorAll(`div[id^=block-input]`)];

    const elementUidMap = allDiv
      .filter((queryDiv) => {
        const domSetContained = domSet.has(queryDiv);
        if (!domSetContained) {
          domSet.delete(queryDiv);
        }
        return domSetContained;
      })
      .reduce((p, div) => {
        const uid = div.id.substring(
          div.id.lastIndexOf("-", div.id.length - 10) + 1
        );
        p[uid] = {
          uid,
          div: div as HTMLElement,
        };
        domSet.delete(div);
        return p;
      }, {} as Record<string, { uid: string; div: HTMLElement }>);
    return elementUidMap;
  };
  const elementUidMap = getBlocksWithElements();
  const getAllBlocks = async () => {
    const uids = Object.keys(elementUidMap);
    const blocks = await window.roamAlphaAPI.data.async.pull_many(
      "[:block/string :block/uid]",
      uids.map((uid) => [":block/uid", uid])
    );
    return blocks;
  };
  const allBlocks = await getAllBlocks();

  const ac = await newAhoCorasick();

  // console.log({ allBlocks });

  const result = allBlocks
    .filter((block) => {
      // console.log({ block });
      // const div = elementUidMap[block[":block/uid"]].div;
      // const el = div.parentElement.querySelector(".roam-ref-radar");
      // if (el) {
      //   // ReactDom.unmountComponentAtNode(el);
      //   // el.remove();
      // }
      return block?.[":block/string"];
    })
    .map((block) => {
      const blockAcResult = ac.search(block[":block/string"]);
      const result = {
        block,
        blockAcResult,
        ...elementUidMap[block[":block/uid"]],
      };

      observers.emit(block[":block/uid"], result);
      return result;
    })
    // 只有查询到有 radar 数据的才显示
    // TODO: 如果没有 acresult 了, 不应该显示雷达了, 但是 popover 是打开的,
    .filter((block) => block.blockAcResult.length);

  // while(result?.length) {
  //   const current = result.pop()

  // }
  //
  result.forEach((item) => {
    let el = item.div.parentElement.querySelector(".roam-ref-radar");
    // console.log({ el, item });
    if (!el) {
      el = document.createElement("div");
      item.div.insertAdjacentElement("afterend", el);
      el.className = "roam-ref-radar";
    }
    // console.log({ item, el }, " ---- right ?");
    // const acResultItem = AC.search(item.block[":block/string"]);
    renderRadar(
      {
        // blockAcResult: acResultItem,
        ...item,
      },
      el
    );
  });
}, 100);
