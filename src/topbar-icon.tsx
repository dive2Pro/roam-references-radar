import { Button, Dialog } from "@blueprintjs/core";
import { useState } from "react";
import ReactDom from "react-dom/client";
import Extension from "./extension";
import AhoCorasick from "ahocorasick";

import { appendToTopbar, extension_helper } from "./helper";

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
          div,
        };
        return p;
      },
      {} as Record<string, { uid: string; div: Element }>,
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
};

function takeAll() {
  getData();
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
