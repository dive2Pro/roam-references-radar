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
   * 在文本中搜索关键词，支持过滤和全词匹配。
   * @param text 要搜索的文本。
   * @param wholeWordOnly 如果为 true，则只匹配完整的西文单词。默认为 true。
   * @returns 匹配结果的数组。
   */
  public search(text: string, wholeWordOnly: boolean = true): Match[] {
    const results: Match[] = [];
    let currentNode = this.root;
    let activeFilterEndMarker: string | null = null;

    const symmetricFilters = [
      { start: "[[", end: "]]" },
      { start: "((", end: "))" },
      { start: "{{", end: "}}" },
      { start: "```", end: "```" },
    ];

    for (let i = 0; i < text.length; i++) {
      // 步骤 1: 处理过滤块 (与之前相同)
      if (activeFilterEndMarker) {
        if (text.startsWith(activeFilterEndMarker, i)) {
          i += activeFilterEndMarker.length - 1;
          activeFilterEndMarker = null;
        }
        continue;
      }

      // 步骤 2: 检查是否进入新的过滤块 (与之前相同)
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

      if (text.startsWith("![", i)) {
        const closeBracketIndex = text.indexOf("]", i + 2);
        if (closeBracketIndex > -1 && text[closeBracketIndex + 1] === "(") {
          if (text.indexOf(")", closeBracketIndex + 2) !== -1) {
            activeFilterEndMarker = ")";
            i = closeBracketIndex + 1;
            continue;
          }
        }
      }

      // 步骤 3: Aho-Corasick 匹配 (与之前相同)
      const char = text[i];
      while (!currentNode.children.has(char) && currentNode !== this.root) {
        currentNode = currentNode.failureLink!;
      }
      if (currentNode.children.has(char)) {
        currentNode = currentNode.children.get(char)!;
      }

      // 步骤 4: 处理匹配结果并进行全词检查 (*** 已修正 ***)
      if (currentNode.output.length > 0) {
        for (const keyword of currentNode.output) {
          const startIndex = i - keyword.length + 1;

          // 如果不需要全词匹配，直接添加结果
          if (!wholeWordOnly) {
            results.push({
              keyword: keyword,
              startIndex: startIndex,
              endIndex: i,
            });
            continue; // 继续处理下一个可能的匹配 (例如 "hers" 中的 "he")
          }

          // --- 执行全词匹配检查 ---
          // 检查匹配到的关键词前后的字符是否为单词边界
          const charBefore = text[startIndex - 1];
          const charAfter = text[i + 1];

          if (
            this.isWordBoundary(charBefore) &&
            this.isWordBoundary(charAfter)
          ) {
            results.push({
              keyword: keyword,
              startIndex: startIndex,
              endIndex: i,
            });
          }
        }
      }
    }

    return results;
  }
}
