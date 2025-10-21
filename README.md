# Roam References Radar

A Roam Research plugin that helps you discover more potential connections in your knowledge graph by identifying and suggesting relevant references.
 


[![](https://raw.githubusercontent.com/dive2Pro/roam-references-radar/refs/heads/main/assets/demo.png)](https://github.com/user-attachments/assets/5727d9dc-5603-4973-ba23-43f41bdb6d5d)

## ChangeLog

- **2025-10-21**
  - **Added:** New configuration option to ignore incomplete matches.
  - **Added:** New configuration option to case insensitive.
  - **Improved:** Matching logic now excludes content within inline code blocks.
  - **Changed:** Relaxed the restriction for the "Preview all" feature; it now activates when there is more than 0 match.

## Key Functionality

1. **Automatic Execution**: The plugin starts working immediately after installation without any manual configuration needed.

2. **Visual Indicators**: When a block contains text that can be referenced to an existing page, an icon appears at the end of the block as a visual indicator.

3. **Interactive Popover**: Clicking on the indicator icon opens a popover that displays all potential reference keywords found in the block.

4. **Multiple Reference Links**: For each identified keyword, the popover displays multiple possible reference links, allowing you to select the most relevant connection for your knowledge graph.

5. **Link All Feature**: The "Link All Preview" button allows you to preview and apply all suggested reference links at once, saving time when multiple keywords are found in a single block.

6. **Keyword Filtering**: You can configure keywords to ignore in the plugin settings, preventing specific pages from appearing in reference suggestions.


### Usage Tips

**Page Recognition Rules**: The plugin automatically identifies pages in your Roam graph but filters out pages with overly short titles (such as single characters) to ensure more accurate and useful connection recommendations.

**Link All Feature**: Click the "Link All Preview" button in the popover to see a preview of all keywords converted to reference links at once. Review the changes and click "Confirm" to apply all links, or "Cancel" to revert.

**Keyword Filtering**: Access plugin settings to add ignore keywords in the format `[[keyword1]],[[keyword2]]`. Pages with these keywords in their titles will be excluded from reference suggestions.


## Installation

### Via Roam Depot

1. In Roam Research, open "Roam Depot"
2. Search for "Roam References Radar" in the marketplace
3. Click the "Install" button


## Development

### Environment Setup

```bash
# Install dependencies
yarn install

# Development mode
yarn dev

# Build production version
yarn build
```


## Contribution

Issues and pull requests are welcome!

## License

MIT
