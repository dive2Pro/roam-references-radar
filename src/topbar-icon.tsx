import {
  Button,
  Dialog,
  Icon,
  Menu,
  Popover,
  MenuItem,
} from "@blueprintjs/core";
import { useRef, useState, ReactNode } from "react";
import ReactDom from "react-dom/client";
import Extension from "./extension";
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

const getData = async () => {
  console.time("DO");
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

async function takeAll() {
  const data = await getData();
  // TODO: 给每一个 block 都添加一个蒙层, 针对探寻出的 page,  鼠标移动上去的时候有一个弹出效果
  data.forEach((item) => {
    const div = document.createElement("div");
    item.div.insertAdjacentElement("afterend", div);
    div.className = "roam-ref-radar";
    ReactDom.createRoot(div).render(<KeywordRadar data={item} />);
  });
  extension_helper.on_uninstall(() => {
    document.querySelectorAll(".roam-ref-radar").forEach((div) => div.remove());
  });
}

const ExpandFromRight = ({
  children,
  isOpen,
  onToggle,
}: {
  children: any;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const contentRef = useRef(null);

  return (
    <div className="expand-container">
      <div
        ref={contentRef}
        className={`expand-content ${isOpen ? "expanded" : "collapsed"}`}
      >
        {children}
      </div>
    </div>
  );
};

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
  data.blockAcResult.forEach((acResultItem) => {
    contents.push(blockString.substring(startIndex, acResultItem.startIndex));
    startIndex = acResultItem.endIndex + 1;
    contents.push(
      <BlockKeyword
        key={acResultItem.keyword}
        keyword={acResultItem.keyword}
      />,
    );
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

function BlockKeyword({ keyword }: { keyword: string }) {
  return (
    // @ts-ignore
    <Popover
      interactionKind="hover"
      autoFocus={false}
      className="roam-ref-radar-popover"
      content={
        <Menu className="roam-ref-radar-menu">
          <MenuItem text="Open in sidebar" icon="add-column-right" />
          <MenuItem text="Open linked references" icon="add-column-right" />
          <MenuItem text="Link" icon="new-link" />
        </Menu>
      }
    >
      <span className="block-keyword">{keyword}</span>
    </Popover>
  );
}

function TopbarIcon() {
  return (
    <>
      <Button
        icon="add"
        onClick={() => {
          takeAll();
        }}
      />
    </>
  );
}

export function initTopbarIcon(extensionAPI: ExtensionAPI) {
  const topbarIcon = appendToTopbar("Extension-Name");
  ReactDom.createRoot(topbarIcon).render(<TopbarIcon />);
  extension_helper.on_uninstall(() => {
    topbarIcon.parentElement.removeChild(topbarIcon);
  });
}
