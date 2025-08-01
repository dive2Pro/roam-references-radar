import { AhoCorasick } from "./AhoCorasick";
import { getIgnoreKeywords } from "./config";

export let AC: AhoCorasick;
export const newAhoCorasick = async () => {
  const ignoreKeywordString = getIgnoreKeywords();
  const ignoreKeywords = extractKeywords(ignoreKeywordString);
  
  const allPages = (
    (await window.roamAlphaAPI.data.async.fast.q(`
      [
        :find (pull ?page [:block/uid :node/title])
        :where
          [?page :node/title ?title]
      ]
      `)) as { ":block/uid": string; ":node/title": string }[] []
  )
    .map((item) => item[0])
    .filter((page) => page[":node/title"].length >= 2)
    .filter((page) => {
      const title = page[":node/title"];
      return !ignoreKeywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      );
    });
  const ac = new AhoCorasick(allPages.map((page) => page[":node/title"]));
  AC = ac;
  return ac;
};

function extractKeywords(text: string) {
  const keywords = [];
  let start = 0;
  let depth = 0;
  let currentStart = -1;

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
