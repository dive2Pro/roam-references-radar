import { Button, Popover } from "@blueprintjs/core";
import React, { ReactNode, useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { Match } from "../AhoCorasick";
import { newAhoCorasick } from "../allPageSearchEngine";
import { groupKeywordsWithText } from "../extension";
import { debounce } from "../utils";
import { BlockKeyword } from "./BlockKeyword";
import { PageRefHint } from "./Hint";

// 1. 每次进入视口中的 block , 雷达扫描一次.
// 2. 撤销和反撤销, 根据影响到的 div , 触发雷达扫描
// 3. 每次扫描后, 如果 popover 是打开的, 只更新内容, 并不关闭

type ObserverParams = {
  uid: string;
  elements: HTMLElement[];
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

export type KeywordRadarData = {
  block: PullBlock;
  blockAcResult: {
    keyword: string;
    startIndex: number;
    endIndex: number;
  }[];
  div: HTMLElement;
};
function KeywordRadar({
  data,
  uninstall,
  el,
}: {
  uninstall: () => void;
  data: KeywordRadarData;
  el: HTMLElement;
}) {
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
      if (!params.blockAcResult.length) {
        setIsPopoverOpen(false);
        setTimeout(() => {
          console.log(` will uninstall : `, el);
          uninstall();
        }, 200);
      }
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
  console.log({ groupKeywords, blockString, contents }, " ____");

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  startIndex = 0;
  const allReplaceContents: ReactNode[] = [];
  let allReplaceContentsBlockString = ``;
  groupKeywords.forEach((acResultItem) => {
    allReplaceContents.push(
      blockString.substring(startIndex, acResultItem.start)
    );
    allReplaceContentsBlockString += blockString.substring(
      startIndex,
      acResultItem.start
    );
    startIndex = acResultItem.end + 1;

    let longestKeyword = "";
    acResultItem.keywords.forEach((item) => {
      longestKeyword =
        item.keyword.length > longestKeyword.length
          ? item.keyword
          : longestKeyword;
    });

    allReplaceContents.push(
      <span>
        <span className="rm-page-ref__brackets">[[</span>
        <span className="rm-page-ref rm-page-ref--link">
          {longestKeyword}
        </span>
        <span className="rm-page-ref__brackets">]]</span>
      </span>
      // <span className="radar-highlighter">{`[[${longestKeyword}]]`}</span>
    );
    allReplaceContentsBlockString += `[[${longestKeyword}]]`;
  });

  allReplaceContents.push(blockString.substring(startIndex));
  allReplaceContentsBlockString += blockString.substring(startIndex);

  const [isPreview, setIsPreview] = useState(false);

  if(!isPopoverOpen && isPreview) {
    setIsPreview(false)
  }
  useEffect(() => {
    const handlePageRefHintHoverEnd = (event: CustomEvent) => {
      console.log("PageRefHint hover animation completed:", event.detail);
      // 这里可以添加动画结束后的处理逻辑
    };

    const radarElement =
      data.div.parentElement?.querySelector(".roam-ref-radar");
    if (radarElement) {
      radarElement.addEventListener(
        "pageRefHintHoverEnd",
        handlePageRefHintHoverEnd as EventListener
      );
    }

    return () => {
      if (radarElement) {
        radarElement.removeEventListener(
          "pageRefHintHoverEnd",
          handlePageRefHintHoverEnd as EventListener
        );
      }
    };
  }, [data.div]);

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
              // paddingRight: 10,
              // height: rect.height,
              // left: rect.left + 20,
              position: "relative",
            }}
          >
            {isPreview ? allReplaceContents : contents}
            {contents.length > 3 ? (
              <>
                <LinkAll
                  onCancel={() => setIsPreview(false)}
                  onPreview={() => setIsPreview(true)}
                  isPreview={isPreview}
                  onConfirm={() => {
                    // setIsPreview(false);
                    console.log({
                      allReplaceContentsBlockString,
                    });
                    window.roamAlphaAPI.data.block.update({
                      block: {
                        uid: data.block[":block/uid"],
                        string: allReplaceContentsBlockString,
                      },
                    });
                    setIsPreview(false);
                  }}
                ></LinkAll>
              </>
            ) : null}
          </div>
        }
        isOpen={isPopoverOpen}
        onClose={() => {
          setIsPopoverOpen(false);
        }}
      >
        <PageRefHint
          style={{
            width: isPopoverOpen ? 20 : undefined,
          }}
          onClick={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
        ></PageRefHint>
      </Popover>
    </>
  );
}

function LinkAll(props: {
  onPreview(): unknown;
  onConfirm: () => void;
  onCancel: () => void;
  isPreview: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        paddingRight: 6,
        paddingTop: 6,
      }}
    >
      {props.isPreview ? (
        <div style={{ display: "flex", gap: 8 }}>
          <Button small intent="success" onClick={() => props.onConfirm()}>
            Confirm
          </Button>
          <Button small onClick={() => props.onCancel()}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          small
          onClick={() => {
            props.onPreview();
          }}
        >
          Link All Preview
        </Button>
      )}
    </div>
  );
}

export function rescan() {}

export function renderRadar(data: KeywordRadarData, el: Element) {
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

const domUidsSet = new Set<String>();

const getUidFromDiv = (div: Element) => {
  const uid = div.id.substring(div.id.lastIndexOf("-", div.id.length - 10) + 1);
  return uid;
};

export function onElementIntersection(entry: IntersectionObserverEntry) {
  if (entry.isIntersecting) {
    domUidsSet.add(getUidFromDiv(entry.target));
  } else {
    domUidsSet.delete(getUidFromDiv(entry.target));
  }
  requestIdleCallback(() => {
    triggerModifyDom();
  });
}

export function onBlockInputChildrenChange(blockInputElement: Element) {
  domUidsSet.add(getUidFromDiv(blockInputElement));
  requestIdleCallback(() => {
    triggerModifyDom();
  });
}

const triggerModifyDom = debounce(async () => {
  const getAllBlocks = async () => {
    const uids = [...domUidsSet.values()];
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
    // 注释的原因是: 当 block  字符串被清空时, 会导致 radar 不消失.
    // .filter((block) => {
    // const div = elementUidMap[block[":block/uid"]].div;
    // const el = div.parentElement.querySelector(".roam-ref-radar");
    // if (el) {
    //   // ReactDom.unmountComponentAtNode(el);
    //   // el.remove();
    // }
    //   return block?.[":block/string"];
    // })
    .filter((block) => block)
    .map((block) => {
      const blockAcResult = ac.search(block?.[":block/string"] || "", false);
      const result = {
        block,
        blockAcResult,
        uid: block[":block/uid"],
        elements: [
          ...document.querySelectorAll(`div[id*="${block[":block/uid"]}"]`),
        ] as HTMLElement[],
      };

      observers.emit(block[":block/uid"], result);
      return result;
    })
    .filter((block) => block.blockAcResult.length);
  domUidsSet.clear();
  result.forEach((item) => {
    item.elements.forEach((element) => {
      let el = element.parentElement.querySelector(".roam-ref-radar");
      // console.log({ el, item });
      if (!el) {
        el = document.createElement("div");
        element.insertAdjacentElement("afterend", el);
        // element.appendChild(el)
        el.className = "roam-ref-radar";
      }
      renderRadar(
        {
          ...item,
          div: element,
        },
        el
      );
    });
  });
}, 100);
