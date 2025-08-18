# Roam References Radar

A Roam Research plugin that helps you discover more potential connections in your knowledge graph by identifying and suggesting relevant references.
 


[![](https://github.com/dive2Pro/roam-references-radar/assets/646fa3b0-391d-44cb-9b12-4d8136647843)](https://github.com/user-attachments/assets/5727d9dc-5603-4973-ba23-43f41bdb6d5d)



## Key Functionality

1. **Automatic Execution**: The plugin starts working immediately after installation without any manual configuration needed.

2. **Visual Indicators**: When a block contains text that can be referenced to an existing page, an icon appears at the end of the block as a visual indicator.

3. **Interactive Popover**: Clicking on the indicator icon opens a popover that displays all potential reference keywords found in the block.

4. **Multiple Reference Links**: For each identified keyword, the popover displays multiple possible reference links, allowing you to select the most relevant connection for your knowledge graph.


### Usage Tips

**Page Recognition Rules**: The plugin automatically identifies pages in your Roam graph but filters out pages with overly short titles (such as single characters) to ensure more accurate and useful connection recommendations.


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
