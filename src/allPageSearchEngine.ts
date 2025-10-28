import { AhoCorasick } from "./AhoCorasick";
import { getCaseInsensitive, getIgnoreKeywords } from "./config";

let lastedQueryTime = 0;
export let AC: AhoCorasick;
export const newAhoCorasick = async () => {
  const ignoreKeywordString = getIgnoreKeywords();
  const ignoreKeywords = extractKeywords(ignoreKeywordString || "");
  let lastEditTime = 0;
  const allPages = (
    (await window.roamAlphaAPI.data.async.fast.q(`
      [
        :find (pull ?page [:block/uid :node/title])
        :where
          [?page :node/title ?title]
      ]
      `)) as {
      ":block/uid": string;
      ":node/title": string;
      ":edit/time": number;
    }[][]
  )
    .map((item) => item[0])
    .filter((page) => page[":node/title"].length >= 2)
    .filter((page) => {
      const title = page[":node/title"];
      lastEditTime = Math.max(lastEditTime, page[":edit/time"]);
      return !ignoreKeywords.some((keyword) =>
        title.toLowerCase().includes(keyword.toLowerCase())
      );
    });
  // 检查到页面有更新时， 比如， 新建的或者更新的时间在上次查询之后的？
  if (AC && lastEditTime <= lastedQueryTime && AC.keywords.length === allPages.length) {
    return AC;
  }
  lastedQueryTime = lastEditTime;
  const ac = new AhoCorasick(
    allPages.map((page) => page[":node/title"]),
    getCaseInsensitive()
  );
  if (AC) {
    AC = undefined;
  }
  AC = ac;
  return ac;
};

function extractKeywords(text: string = "") {
  const keywords = [];
  let start = 0;
  let depth = 0;
  let currentStart = -1;
  console.log({ text });
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[" && text[i + 1] === "[") {
      if (depth === 0) {
        currentStart = i;
      }
      depth++;
      i++; // 跳过第二个 '['
    } else if (text[i] === "]" && text[i + 1] === "]") {
      depth--;
      if (depth === 0 && currentStart !== -1) {
        const keyword = text.substring(currentStart + 2, i);
        keywords.push(keyword);
        currentStart = -1;
      }
      i++; // 跳过第二个 ']'
    }
  }

  return keywords;
}
