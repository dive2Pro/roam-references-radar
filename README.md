# Roam References Radar

A Roam Research plugin that helps you discover more potential connections in your knowledge graph by identifying and suggesting relevant references.


## Key Functionality

1. **Automatic Execution**: The plugin starts working immediately after installation without any manual configuration needed.

2. **Visual Indicators**: When a block contains text that can be referenced to an existing page, an icon appears at the end of the block as a visual indicator.

3. **Interactive Popover**: Clicking on the indicator icon opens a popover that displays all potential reference keywords found in the block.

4. **Multiple Reference Links**: For each identified keyword, the popover displays multiple possible reference links, allowing you to select the most relevant connection for your knowledge graph.

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

### Project Structure

- `src/AhoCorasick.ts` - Efficient string matching algorithm implementation
- `src/comps/KeywordRadar.tsx` - Keyword Radar component
- `src/globalExpander.tsx` - Global Expander implementation
- `src/allPageSearchEngine.ts` - All Page Search Engine
- `src/topbar-icon.tsx` - Topbar icon and initialization logic

## Contribution

Issues and pull requests are welcome!

## License

MIT
