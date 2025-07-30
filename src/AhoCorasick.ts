/**
 * 匹配结果的接口定义
 */
export interface Match {
  keyword: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Aho-Corasick 自动机的节点
 */
class AhoCorasickNode {
  public children: Map<string, AhoCorasickNode> = new Map();
  public failureLink: AhoCorasickNode | null = null;
  public output: string[] = [];
}

export class AhoCorasick {
  private root: AhoCorasickNode;
  // 正则表达式，用于高效判断一个字符是否为英文字母
  private static readonly IS_LETTER_REGEX = /^[a-zA-Z]$/;
  // 非对称标记：它们的存在本身就构成格式化
  private static readonly UNPAIRED_MD_MARKERS: string[] = [
    "#",
    ">",
    "```",
    // "`",
    "\n",
    // "- ",
    // "+ ",
    // "* ", // 列表项需要后面的空格来区分
  ];
  private static readonly URL_REGEX =
    /\b(?:(?:https?|ftp):\/\/|www\.)[-a-zA-Z0-9+&@#\/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#\/%=~_|]|\b[a-zA-Z0-9.-]+\.(?:com|org|net|gov|edu|io|co|dev|app)\b/gi;
  // 对称标记：必须成对出现才算格式化
  private static readonly PAIRED_MD_MARKERS: { start: string; end: string }[] =
    [
      { start: "[[", end: "]]" },
      { start: "((", end: "))" },
      { start: "{{", end: "}}" },
      { start: "**", end: "**" },
      { start: "__", end: "__" },
      { start: "~~", end: "~~" },
      { start: "*", end: "*" }, // 单星号斜体
      { start: "_", end: "_" }, // 单下划线斜体
      { start: "`", end: "`" },
    ];
  constructor(keywords: string[]) {
    this.root = new AhoCorasickNode();
    const uniqueKeywords = [...new Set(keywords.filter((kw) => kw.length > 0))];
    if (uniqueKeywords.length > 0) {
      this.buildTrie(uniqueKeywords);
      this.buildFailureLinks();
    }
  }

  private buildTrie(keywords: string[]): void {
    for (const keyword of keywords) {
      let currentNode = this.root;
      for (const char of keyword) {
        if (!currentNode.children.has(char)) {
          currentNode.children.set(char, new AhoCorasickNode());
        }
        currentNode = currentNode.children.get(char)!;
      }
      currentNode.output.push(keyword);
    }
  }

  private buildFailureLinks(): void {
    const queue: AhoCorasickNode[] = [];
    this.root.failureLink = this.root;
    for (const node of this.root.children.values()) {
      node.failureLink = this.root;
      queue.push(node);
    }
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      for (const [char, childNode] of currentNode.children.entries()) {
        let failureNode = currentNode.failureLink!;
        while (!failureNode.children.has(char) && failureNode !== this.root) {
          failureNode = failureNode.failureLink!;
        }
        if (failureNode.children.has(char)) {
          childNode.failureLink = failureNode.children.get(char)!;
        } else {
          childNode.failureLink = this.root;
        }
        childNode.output.push(...childNode.failureLink.output);
        queue.push(childNode);
      }
    }
  }

  /**
   * 检查给定字符是否为单词边界。
   * @param char 要检查的字符。`undefined` 表示字符串的开头或结尾。
   * @returns 如果是单词边界，则为 true。
   */
  private isWordBoundary(char: string | undefined): boolean {
    // 字符串的开头/结尾是边界
    if (char === undefined) {
      return true;
    }
    // 非字母字符是边界
    return !AhoCorasick.IS_LETTER_REGEX.test(char);
  }

  /**
   * 检查给定的前缀字符串是否包含有效的 Markdown 格式。
   * @param prefix 要检查的字符串。
   * @returns 如果包含格式化，则为 true。
   */
  private isPrefixFormatted(prefix: string): boolean {
    // 1. 检查是否存在任何非对称标记
    if (
      AhoCorasick.UNPAIRED_MD_MARKERS.some((marker) => prefix.includes(marker))
    ) {
      return true;
    }

    // 2. 检查是否存在任何完整的、对称的标记对
    for (const pair of AhoCorasick.PAIRED_MD_MARKERS) {
      const startIndex = prefix.indexOf(pair.start);

      // 如果找到了开始标记
      if (startIndex !== -1) {
        // 从开始标记之后的位置，查找结束标记
        const endIndex = prefix.indexOf(
          pair.end,
          startIndex + pair.start.length
        );

        // 如果也找到了结束标记，那么就确认存在格式化
        if (endIndex !== -1) {
          return true;
        }
      }
    }

    // 如果所有检查都未通过，则认为不包含格式化
    return false;
  }

  /**
   * 在文本中搜索关键词，支持过滤和全词匹配。
   * @param text 要搜索的文本。
   * @param wholeWordOnly 如果为 true，则只匹配完整的西文单词。默认为 true。
   * @returns 匹配结果的数组。
   */
  public search(text: string, wholeWordOnly: boolean = true): Match[] {
    const results: Match[] = [];
    if (!text) {
      return results;
    }

    // 步骤 0: 预处理，找出所有 URL 的范围
    const urlRanges: { start: number; end: number }[] = [];
    // 重置正则表达式的 lastIndex，确保多次调用 search 时行为正确
    AhoCorasick.URL_REGEX.lastIndex = 0;
    let urlMatch;
    while ((urlMatch = AhoCorasick.URL_REGEX.exec(text)) !== null) {
      urlRanges.push({
        start: urlMatch.index,
        end: urlMatch.index + urlMatch[0].length - 1,
      });
    }
    let currentUrlRangeIndex = 0;

    let currentNode = this.root;
    let activeFilterEndMarker: string | null = null;

    const symmetricFilters = [
      { start: "[[", end: "]]" },
      { start: "((", end: "))" },
      { start: "{{", end: "}}" },
      { start: "```", end: "```" },
    ];

    for (let i = 0; i < text.length; i++) {
      // 步骤 1: 检查并跳过 URL
      if (
        currentUrlRangeIndex < urlRanges.length &&
        i >= urlRanges[currentUrlRangeIndex].start
      ) {
        const range = urlRanges[currentUrlRangeIndex];
        i = range.end; // 直接跳转到 URL 的末尾
        currentNode = this.root; // **重要**: 重置 AC 状态机
        currentUrlRangeIndex++;
        continue;
      }

      // 步骤 2: 处理对称过滤块 (如 [[...]])
      if (activeFilterEndMarker) {
        if (text.startsWith(activeFilterEndMarker, i)) {
          i += activeFilterEndMarker.length - 1;
          activeFilterEndMarker = null;
          currentNode = this.root; // **重要**: 重置 AC 状态机
        }
        continue;
      }

      let newFilterFound = false;
      for (const filter of symmetricFilters) {
        if (text.startsWith(filter.start, i)) {
          if (text.indexOf(filter.end, i + filter.start.length) !== -1) {
            activeFilterEndMarker = filter.end;
            i += filter.start.length - 1;
            newFilterFound = true;
            break;
          }
        }
      }
      if (newFilterFound) continue;

      // 处理 Markdown 图片链接 `![alt](src)`
      if (text.startsWith("![", i)) {
        const closeBracketIndex = text.indexOf("]", i + 2);
        if (closeBracketIndex > -1 && text[closeBracketIndex + 1] === "(") {
          const closeParenIndex = text.indexOf(")", closeBracketIndex + 2);
          if (closeParenIndex !== -1) {
            i = closeParenIndex; // 跳转到链接末尾
            currentNode = this.root; // **重要**: 重置 AC 状态机
            continue;
          }
        }
      }

      // 步骤 3: Aho-Corasick 匹配
      const char = text[i];
      while (!currentNode.children.has(char) && currentNode !== this.root) {
        currentNode = currentNode.failureLink!;
      }
      if (currentNode.children.has(char)) {
        currentNode = currentNode.children.get(char)!;
      }

      // 步骤 4: 处理匹配结果并进行全词检查
      if (currentNode.output.length > 0) {
        for (const keyword of currentNode.output) {
          const startIndex = i - keyword.length + 1;

          if (!wholeWordOnly) {
            results.push({ keyword, startIndex, endIndex: i });
            continue;
          }

          const charBefore = text[startIndex - 1];
          const charAfter = text[i + 1];

          if (
            this.isWordBoundary(charBefore) &&
            this.isWordBoundary(charAfter)
          ) {
            results.push({ keyword, startIndex, endIndex: i });
          }
        }
      }
    }

    return results;
  }
}
