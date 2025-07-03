import { Button, Dialog, Icon } from "@blueprintjs/core";
import { useRef, useState } from "react";
import ReactDom from "react-dom/client";
import Extension from "./extension";
import AhoCorasick from "ahocorasick";

import { appendToTopbar, extension_helper } from "./helper";
import { Popover, usePopover } from "./globalExpander";

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
    div.className = "roam-keyword-radar";
    ReactDom.createRoot(div).render(<KeywordRadar data={item} />);
  });
  extension_helper.on_uninstall(() => {
    document
      .querySelectorAll(".roam-keyword-radar")
      .forEach((div) => div.remove());
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
    blockAcResult: [number, string[]][];
    div: HTMLElement;
  };
}) {
  const [isOpen, setOpen] = useState(false);
  const divRect = data.div.getBoundingClientRect();
  const popover = usePopover();
  return (
    // @ts-ignore
    <div>
      <Icon
        onClick={() => {
          console.log(` open global`);
          popover.triggerProps.onClick(data.div);
        }}
        icon="star"
      ></Icon>
      <Popover {...popover.popoverProps} width={200}>
        <div className="roam-block">{data.block[":block/string"]}</div>
      </Popover>
      {/* <Dialog
        // usePortal={false}
        portalContainer={data.div.parentElement}
        onClose={() => {
          setOpen(false);
        }}
        isOpen={isOpen}
      >
        <div>{data.block[":block/string"]}</div>
      </Dialog> */}
    </div>
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
