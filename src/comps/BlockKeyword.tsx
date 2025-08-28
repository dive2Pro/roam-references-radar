import { Menu, MenuItem, Popover } from "@blueprintjs/core";
import { ReactNode, useState } from "react";

export function BlockKeyword({
  data,
  uid,
  blockString,
  onChange,
}: {
  uid: string;
  data: GroupedResultWithText;
  blockString: string;
  onChange: (v: string) => void;
}) {
  // const [content, setContent] = useState<ReactNode[]>([data.text]);
  const [active, setActive] = useState<Keyword>();
  let content: ReactNode[] = [data.text];
  if (active) {
    content = [<span>{data.text.substring(0, active.startIndex)}</span>];
    content.push(
      <span>
        <span className="rm-page-ref__brackets">[[</span>
        <span className="rm-page-ref rm-page-ref--link">{active.keyword}</span>
        <span className="rm-page-ref__brackets">]]</span>
      </span>
    );
    content.push(<span>{data.text.substring(active.endIndex + 1)}</span>);
  }
  return (
    // @ts-ignore
    <Popover
      interactionKind="hover"
      autoFocus={false}
      popoverClassName="roam-ref-radar-popover"
      openOnTargetFocus={false}
      content={
        <Menu className="roam-ref-radar-menu">
          {/* <MenuItem
            text="Open in sidebar"
            icon="add-column-right"
            onClick={() => {
              window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: {
                  type: "block",
                  "block-uid": window.roamAlphaAPI.data.q(`
                    [
                      :find ?e .
                      :where
                        [?p :node/title "here"]
                        [?p :block/uid ?e]
                    ]
                    `) as unknown as string,
                },
              });
            }}
          />
          <MenuItem
            text="Open linked references"
            icon="add-column-right"
            onClick={() => {
              window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: {
                  type: "mentions",
                  "block-uid": window.roamAlphaAPI.data.q(`
                  [
                    :find ?e .
                    :where
                      [?p :node/title "here"]
                      [?p :block/uid ?e]
                  ]
                  `) as unknown as string,
                },
              });
            }}
          /> */}
          {data.keywords.map((keywordItem) => {
            return (
              <MenuItem
                text={`[[${keywordItem.keyword}]]`}
                icon="git-new-branch"
                onMouseEnter={() => {
                  setActive(keywordItem);
                }}
                onMouseLeave={() => {
                  console.log("leave - ", keywordItem);
                  setActive(undefined);
                }}
                onClick={() => {
                  /**
                   * 1. 更新数据源
                   * 2. 更新当前组件
                   * 3. 关闭弹窗
                   */
                  const newBlockString =
                    blockString.substring(0, keywordItem.startIndex) +
                    `[[${keywordItem.keyword}]]` +
                    blockString.substring(keywordItem.endIndex + 1);
                  window.roamAlphaAPI.data.block.update({
                    block: {
                      uid: uid,
                      string: newBlockString,
                    },
                  });
                  onChange(newBlockString);
                }}
              />
            );
          })}
        </Menu>
      }
      captureDismiss
    >
      <span className="radar-highlighter">{content}</span>
    </Popover>
  );
}
