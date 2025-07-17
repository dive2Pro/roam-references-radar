import { Menu, MenuItem, Popover } from "@blueprintjs/core";

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
  return (
    // @ts-ignore
    <Popover
      // interactionKind="hover"
      autoFocus={false}
      popoverClassName="roam-ref-radar-popover"
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
      <span className="block-keyword">{data.text}</span>
    </Popover>
  );
}
