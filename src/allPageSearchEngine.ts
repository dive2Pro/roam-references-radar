import { AhoCorasick } from "./AhoCorasick";

export let AC: AhoCorasick;
export const newAhoCorasick = async () => {
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
  AC = ac;
  return ac;
};
