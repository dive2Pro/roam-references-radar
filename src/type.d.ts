// Type definitions for RoamAlphaAPI and ExtensionAPI
// Generated based on the provided Roam Research API documentation.

type Uid = string;
/**
 * A Datomic entity ID. It can be:
 * - A database ID (number).
 * - A lookup ref `[<unique-attribute>, <value>]` as a tuple.
 * - A lookup ref `[":block/uid", "xyz"]` as a string.
 * - An entity unique identifier string.
 */
type Eid = number | string | [string, any];

/**
 * Represents the hierarchical structure of a block or page entity returned by a pull query.
 * It's a flexible object, but commonly used keys are defined.
 */
interface PullBlock {
  ":db/id"?: number;
  ":block/string"?: string;
  ":block/uid"?: Uid;
  ":block/order"?: number;
  ":block/heading"?: 0 | 1 | 2 | 3;
  ":block/text-align"?: "left" | "center" | "right" | "justify";
  ":block/children"?: PullBlock[];
  ":block/open"?: boolean;
  ":children/view-type"?: ":bullet" | ":numbered" | ":document";
  ":node/title"?: string;
  ":edit/time"?: number;
  [key: string]: any; // Allows for other attributes and aliased keys
}

/**
 * Represents the location for creating or moving a block.
 */
interface Location {
  "parent-uid": Uid;
  order: number;
}

/**
 * Represents a block's properties for creation or update.
 */
interface Block {
  string: string;
  uid?: Uid;
  open?: boolean;
  heading?: 0 | 1 | 2 | 3;
  "text-align"?: "left" | "center" | "right" | "justify";
  "children-view-type"?: ":bullet" | ":numbered" | ":document";
}

/**
 * Represents a page's properties for creation or update.
 */
interface Page {
  title: string;
  uid?: Uid;
  "children-view-type"?: ":bullet" | ":numbered" | ":document";
}

type SidebarWindowType =
  | "mentions"
  | "block"
  | "outline"
  | "graph"
  | "search-query";

interface BaseSidebarWindowInput {
  type: SidebarWindowType;
  order?: number;
}

interface BlockSidebarWindowInput extends BaseSidebarWindowInput {
  type: "mentions" | "block" | "outline" | "graph";
  "block-uid": Uid;
}

interface SearchSidebarWindowInput extends BaseSidebarWindowInput {
  type: "search-query";
  "search-query-str": string;
}

type SidebarWindowInput = BlockSidebarWindowInput | SearchSidebarWindowInput;

interface WindowInfo {
  "window-id": string;
  type: SidebarWindowType;
  "block-uid"?: Uid;
  "search-query-str"?: string;
  "pinned-to-top?"?: boolean;
  order?: number;
  // Note: The actual object may contain more fields.
}

interface FocusedBlock {
  "block-uid": Uid;
  "window-id": string;
}

/**
 * Context object passed to block context menu callbacks.
 */
interface BlockContext {
  "block-string": string;
  "block-uid": Uid;
  heading: 0 | 1 | 2 | 3 | null;
  "page-uid": Uid;
  "read-only?": boolean;
  "window-id": string;
}

/**
 * Hotkey modifiers for command palette commands.
 */
type HotkeyModifier = "shift" | "ctrl" | "alt" | "super" | "defmod";

/**
 * Context object passed to graph view callbacks.
 */
interface GraphViewContext {
  cytoscape: any; // The Cytoscape.js core instance
  elements: {
    id: string;
    name: string;
    weight: number;
    source?: string;
    target?: string;
  }[];
  type: "page" | "all-pages";
}

/**
 * The main Roam Alpha API exposed on the `window` object.
 */
interface RoamAlphaAPI {
  /**
   * Functions for reading and writing data to the Roam graph.
   */
  data: {
    /**
     * Query the graph using datomic flavored datalog.
     * @param query The datalog query string.
     * @param args Additional arguments for the query.
     * @returns A relation of results.
     */
    q: (query: string, ...args: any[]) => any[][];

    /**
     * Declaratively make hierarchical selections of information about an entity.
     * @param pattern A pull pattern string.
     * @param eid The entity identifier.
     * @returns A map representing the entity's data.
     */
    pull: (pattern: string, eid: Eid) => PullBlock | null;

    /**
     * Same as `.pull` but for multiple entities.
     * @param pattern A pull pattern string.
     * @param eids An array of entity identifiers.
     * @returns An array of maps representing each entity's data.
     */
    pull_many: (pattern: string, eids: Eid[]) => (PullBlock | null)[];

    /**
     * Faster, experimental read-access functions. Return read-only proxy objects.
     */
    fast: {
      /**
       * A faster, experimental version of `.q`.
       */
      q: (query: string, ...args: any[]) => any; // Returns a read-only cljs proxy
    };

    /**
     * Asynchronous versions of the data access functions that return Promises.
     * Prefer these for new extensions.
     */
    async: {
      q: (query: string, ...args: any[]) => Promise<any[][]>;
      pull: (pattern: string, eid: Eid) => Promise<PullBlock | null>;
      pull_many: (
        pattern: string,
        eids: Eid[],
      ) => Promise<(PullBlock | null)[]>;
      fast: {
        q: (query: string, ...args: any[]) => Promise<any>;
      };
    };

    /**
     * Functions that run against the backend (off-thread). The backend could be a few changes behind.
     */
    backend: {
      /**
       * Run a datalog query on the backend.
       */
      q: (query: string, ...args: any[]) => Promise<any[][]>;
    };

    /**
     * Watches for changes on pull patterns and provides a callback to execute.
     * @param pullPattern The pull pattern to watch.
     * @param entityId The entity ID to watch.
     * @param callback A function that receives the before and after state.
     * @returns A promise that resolves to true upon successful registration.
     */
    addPullWatch: (
      pullPattern: string,
      entityId: string, // entity-id is documented as string, e.g., '[:block/uid "02-21-2021"]'
      callback: (before: PullBlock | null, after: PullBlock | null) => void,
    ) => Promise<boolean>;

    /**
     * Removes a pull watch.
     * @param pullPattern The pull pattern of the watch to remove.
     * @param entityId The entity ID of the watch to remove.
     * @param callback If provided, only removes the watch with this specific callback.
     * @returns A promise that resolves to true upon successful removal.
     */
    removePullWatch: (
      pullPattern: string,
      entityId: string,
      callback?: (before: PullBlock | null, after: PullBlock | null) => void,
    ) => Promise<boolean>;

    /**
     * Performs an undo operation in Roam.
     */
    undo: () => Promise<boolean>;

    /**
     * Performs a redo operation in Roam.
     */
    redo: () => Promise<boolean>;

    /**
     * Functions for manipulating blocks.
     */
    block: {
      /**
       * Creates a new block at a specified location.
       * @param args An object containing location and block data.
       * @returns A promise that resolves to true upon successful creation.
       */
      create: (args: { location: Location; block: Block }) => Promise<boolean>;

      /**
       * Moves a block to a new location.
       * @param args An object containing the new location and the block's UID.
       * @returns A promise that resolves to true upon successful move.
       */
      move: (args: {
        location: Location;
        block: { uid: Uid };
      }) => Promise<boolean>;

      /**
       * Updates a block's text and/or other properties.
       * @param args An object containing the block's UID and the properties to update.
       * @returns A promise that resolves to true upon successful update.
       */
      update: (args: {
        block: { uid: Uid } & Partial<Block>;
      }) => Promise<boolean>;

      /**
       * Deletes a block and all its children.
       * @param args An object containing the block's UID.
       * @returns A promise that resolves to true upon successful deletion.
       */
      delete: (args: { block: { uid: Uid } }) => Promise<boolean>;

      /**
       * Reorders the direct children of a parent block.
       * @param args An object containing the parent's UID and an ordered array of all its children's UIDs.
       * @returns A promise that resolves to true upon successful reordering.
       */
      reorderBlocks: (args: {
        location: { "parent-uid": Uid };
        blocks: Uid[];
      }) => Promise<boolean>;
    };

    /**
     * Functions for manipulating pages.
     */
    page: {
      /**
       * Creates a new page.
       * @param args An object containing the page data.
       * @returns A promise that resolves to true upon successful creation.
       */
      create: (args: { page: Page }) => Promise<boolean>;

      /**
       * Updates a page's title and/or other properties.
       * @param args An object containing the page's UID and the properties to update.
       * @returns A promise that resolves to true upon successful update.
       */
      update: (args: {
        page: { uid: Uid } & Partial<Page>;
      }) => Promise<boolean>;

      /**
       * Deletes a page and all its content.
       * @param args An object containing the page's UID.
       * @returns A promise that resolves to true upon successful deletion.
       */
      delete: (args: { page: { uid: Uid } }) => Promise<boolean>;
    };

    /**
     * Functions for manipulating user entities.
     */
    user: {
      /**
       * Creates and/or updates a user entity.
       * @param args An object containing the user's UID and optional display name.
       * @returns A promise that resolves to true upon successful upsert.
       */
      upsert: (args: {
        "user-uid": Uid;
        "display-name"?: string;
      }) => Promise<boolean>;
    };
  };

  /**
   * Functions for interacting with the Roam user interface.
   */
  ui: {
    /**
     * Returns metadata about the currently focused block.
     * @returns An object with block and window identifiers, or null if no block is focused.
     */
    getFocusedBlock: () => FocusedBlock | null;

    /**
     * Focuses on a given block and optionally sets the cursor position or selection.
     * @param args An object specifying location and selection.
     */
    setBlockFocusAndSelection: (args: {
      location?: { "block-uid": Uid; "window-id": string | "main-window" };
      selection?: { start: number; end?: number };
    }) => void;

    /**
     * Functions for controlling the main window.
     */
    mainWindow: {
      /**
       * Opens a block or page in the main window.
       * @param args An object containing the UID of the block or page.
       */
      openBlock: (args: { block: { uid: Uid } }) => Promise<boolean>;
      /**
       * Opens a page in the main window.
       * @param args An object containing the page's UID or title.
       */
      openPage: (args: {
        page: { uid: Uid } | { title: string };
      }) => Promise<boolean>;
      /**
       * Opens the Daily Notes page in the main window.
       */
      openDailyNotes: () => Promise<boolean>;
      /**
       * Returns the UID of the page or block currently open in the main window.
       */
      getOpenPageOrBlockUid: () => Uid | null;
      /**
       * Focuses on the first block in the main window.
       */
      focusFirstBlock: () => void;
    };

    /**
     * Functions for controlling the left sidebar.
     */
    leftSidebar: {
      /**
       * Makes the left sidebar visible.
       */
      open: () => Promise<boolean>;
      /**
       * Hides the left sidebar.
       */
      close: () => Promise<boolean>;
    };

    /**
     * Functions for controlling the right sidebar.
     */
    rightSidebar: {
      /**
       * Makes the right sidebar visible.
       */
      open: () => Promise<boolean>;
      /**
       * Hides the right sidebar.
       */
      close: () => Promise<boolean>;
      /**
       * Returns an array of all open windows in the right sidebar.
       */
      getWindows: () => WindowInfo[];
      /**
       * Adds a new window to the right sidebar.
       */
      addWindow: (args: { window: SidebarWindowInput }) => Promise<boolean>;
      /**
       * Removes a window from the right sidebar.
       */
      removeWindow: (args: {
        window: Omit<SidebarWindowInput, "order">;
      }) => Promise<boolean>;
      /**
       * Expands a window in the right sidebar.
       */
      expandWindow: (args: {
        window: Omit<SidebarWindowInput, "order">;
      }) => Promise<boolean>;
      /**
       * Collapses a window in the right sidebar.
       */
      collapseWindow: (args: {
        window: Omit<SidebarWindowInput, "order">;
      }) => Promise<boolean>;
      /**
       * Pins or unpins a window to the top of the right sidebar.
       */
      pinWindow: (args: {
        window: Omit<SidebarWindowInput, "order">;
        "pin-to-top?"?: boolean;
      }) => Promise<boolean>;
      /**
       * Unpins a window from the top of the right sidebar.
       */
      unpinWindow: (args: {
        window: Omit<SidebarWindowInput, "order">;
      }) => Promise<boolean>;
      /**
       * Sets the order of a window in the right sidebar.
       */
      setWindowOrder: (args: {
        window: SidebarWindowInput & { order: number };
      }) => Promise<boolean>;
    };

    /**
     * Functions for managing page and global filters.
     */
    filters: {
      /**
       * Adds a global filter.
       */
      addGlobalFilter: (
        title: string,
        type: "includes" | "removes",
      ) => Promise<boolean>;
      /**
       * Removes a global filter.
       */
      removeGlobalFilter: (
        title: string,
        type: "includes" | "removes",
      ) => Promise<boolean>;
      /**
       * Gets all current global filters.
       */
      getGlobalFilters: () => Promise<{
        includes: string[];
        removes: string[];
      }>;
      /**
       * Gets the filters for a specific page.
       */
      getPageFilters: (args: {
        page: { uid: Uid } | { title: string };
      }) => Promise<{ includes: string[]; removes: string[] }>;
      /**
       * Gets the linked references filters for a specific page.
       */
      getPageLinkedRefsFilters: (args: {
        page: { uid: Uid } | { title: string };
      }) => Promise<{ includes: string[]; removes: string[] }>;
      /**
       * Gets the filters for a specific sidebar window.
       */
      getSidebarWindowFilters: (args: {
        window: Omit<SidebarWindowInput, "order">;
      }) => Promise<{ includes: string[]; removes: string[] }>;
      /**
       * Sets the filters for a page.
       */
      setPageFilters: (args: {
        page: { uid: Uid } | { title: string };
        filters: { includes?: string[]; removes?: string[] };
      }) => Promise<boolean>;
      /**
       * Sets the linked references filters for a page.
       */
      setPageLinkedRefsFilters: (args: {
        page: { uid: Uid } | { title: string };
        filters: { includes?: string[]; removes?: string[] };
      }) => Promise<boolean>;
      /**
       * Sets the filters for a sidebar window.
       */
      setSidebarWindowFilters: (args: {
        window: Omit<SidebarWindowInput, "order">;
        filters: { includes?: string[]; removes?: string[] };
      }) => Promise<boolean>;
    };

    /**
     * Functions for interacting with the Command Palette (Cmd+P).
     */
    commandPalette: {
      /**
       * Adds a command to the Command Palette.
       */
      addCommand: (args: {
        label: string;
        callback: () => void;
        "disable-hotkey"?: boolean;
        "default-hotkey"?: string | string[];
      }) => Promise<void>;
      /**
       * Removes a command from the Command Palette.
       */
      removeCommand: (args: { label: string }) => Promise<void>;
    };

    /**
     * Functions for interacting with the Block Context Menu (right-click on a bullet).
     */
    blockContextMenu: {
      /**
       * Adds a command to the block context menu.
       */
      addCommand: (args: {
        label: string;
        "display-conditional"?: (context: BlockContext) => boolean;
        callback: (context: BlockContext) => void;
      }) => Promise<void>;
      /**
       * Removes a command from the block context menu.
       */
      removeCommand: (args: { label: string }) => Promise<void>;
    };

    /**
     * Functions for interacting with individual multi-select (cmd-m).
     */
    individualMultiselect: {
      /**
       * Gets the UIDs of all currently selected blocks.
       */
      getSelectedUids: () => Uid[];
    };

    /**
     * Functions for interacting with the Multi-Select Context Menu.
     */
    msContextMenu: {
      /**
       * Adds a command to the multi-select context menu.
       */
      addCommand: (args: {
        label: string;
        "display-conditional"?: () => boolean; // Context argument not documented
        callback: () => void;
      }) => Promise<void>;
      /**
       * Removes a command from the multi-select context menu.
       */
      removeCommand: (args: { label: string }) => Promise<void>;
    };

    /**
     * Functions for interacting with the Graph View.
     */
    graphView: {
      /**
       * Adds a callback that fires when a graph view is loaded.
       */
      addCallback: (args: {
        label: string;
        callback: (context: GraphViewContext) => void;
        type?: "page" | "all-pages";
      }) => Promise<void>;
      /**
       * Removes a graph view callback.
       */
      removeCallback: (args: { label: string }) => Promise<void>;
      /**
       * API for the new whole graph overview.
       */
      wholeGraph: {
        addCallback: (args: {
          label: string;
          callback: (context: any) => void;
        }) => void;
        removeCallback: (args: { label: string }) => void;
        setExplorePages: (pages: string[]) => void;
        getExplorePages: () => string[];
        setMode: (mode: "Whole Graph" | "Explore") => void;
      };
    };

    /**
     * Functions for rendering Roam components into the DOM.
     */
    components: {
      /**
       * Renders a given block with its children into a DOM element.
       */
      renderBlock: (args: {
        uid: Uid;
        el: HTMLElement;
        "zoom-path?"?: boolean;
        "open?"?: boolean;
      }) => Promise<boolean>;
      /**
       * Renders a given page with its children into a DOM element.
       */
      renderPage: (args: {
        uid: Uid;
        el: HTMLElement;
        "hide-mentions?"?: boolean;
      }) => Promise<boolean>;
      /**
       * Renders search results for a query string into a DOM element.
       */
      renderSearch: (args: {
        "search-query-str": string;
        el: HTMLElement;
        "closed?"?: boolean;
        "group-by-page?"?: boolean;
        "hide-paths?"?: boolean;
        "config-changed-callback"?: (config: any) => void;
      }) => Promise<boolean>;
      /**
       * Renders a Roam-flavored markdown string into a DOM element.
       */
      renderString: (args: {
        string: string;
        el: HTMLElement;
      }) => Promise<boolean>;
      /**
       * Unmounts a rendered Roam component from a DOM element.
       */
      unmountNode: (args: { el: HTMLElement }) => Promise<boolean>;
    };
  };

  /**
   * Utility functions.
   */
  util: {
    /**
     * Generates a random 9-character Roam UID.
     */
    generateUID: () => Uid;
    /**
     * Converts a daily note page title to a JavaScript Date object.
     */
    pageTitleToDate: (title: string) => Date | null;
    /**
     * Converts a JavaScript Date object to a daily note page title.
     */
    dateToPageTitle: (date: Date) => string;
    /**
     * Converts a JavaScript Date object to a daily note page UID (MM-DD-YYYY).
     */
    dateToPageUid: (date: Date) => Uid;
  };

  /**
   * Information about the user's platform.
   */
  platform: {
    isDesktop: boolean;
    isMobileApp: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isPC: boolean;
    isTouchDevice: boolean;
  };

  /**
   * Information about the current graph.
   */
  graph: {
    name: string;
    type: "hosted" | "offline";
    isEncrypted: boolean;
  };

  /**
   * Functions for file management in Roam.
   */
  file: {
    /**
     * Upload a file to Roam's storage.
     * @returns A promise that resolves to the file's download URL.
     */
    upload: (args: {
      file: File;
      toast?: { hide: boolean };
    }) => Promise<string>;
    /**
     * Fetch a file hosted on Roam, handling decryption if necessary.
     * @returns A promise that resolves to a File object.
     */
    get: (args: { url: string }) => Promise<File>;
    /**
     * Delete a file hosted on Roam.
     */
    delete: (args: { url: string }) => Promise<void>;
  };

  /**
   * Information about the current user.
   */
  user: {
    /**
     * The current user's UID.
     */
    uid: () => Uid | null;
  };

  /**
   * Useful constants.
   */
  constants: {
    /**
     * The URL for a CORS-anywhere proxy hosted by the Roam team.
     */
    corsAnywhereProxyUrl: string;
  };
}

// --- Extension API ---

type PanelAction =
  | { type: "input"; placeholder?: string; onChange: (evt: { target: { value: string }}) => void }
  | { type: "switch"; onChange: (evt: { target: { checked: boolean }}) => void }
  | { type: "select"; items: string[] }
  | { type: "button"; text: string; onClick?: () => void }
  | { [key: string]: any }; // For custom action types

interface PanelSetting {
  /** An id for the setting. Must be a non-empty string and cannot contain ".", "#", "$", "[", or "]". */
  id: string;
  name: string;
  description: string;
  action: PanelAction;
}

interface PanelConfig {
  tabTitle:  string;
  settings: PanelSetting[];
}

/**
 * The API provided to a Roam extension's entry point function.
 */
interface ExtensionAPI {
  /**
   * Extension-scoped settings that are persisted across devices.
   */
  settings: {
    /**
     * Set a value for a given key.
     */
    set: (key: string, value: any) => Promise<void>;
    /**
     * Get the value for a given key.
     */
    get: (key: string) => any;
    /**
     * Get all settings for the extension.
     */
    getAll: () => Record<string, any>;
    /**
     * Functions for creating a settings panel for the extension.
     */
    panel: {
      /**
       * Creates the settings panel UI based on a configuration object.
       */
      create: (config: PanelConfig) => void;
    };
  };
  /**
   * UI functions scoped to the extension. Commands added here are automatically cleaned up.
   */
  ui: {
    commandPalette: {
      /**
       * Adds a command to the Command Palette, scoped to the extension.
       */
      addCommand: (args: {
        label: string;
        callback: () => void;
        "disable-hotkey"?: boolean;
        "default-hotkey"?: string | string[];
      }) => void; // Sync, unlike the roamAlphaAPI version
      /**
       * Removes a command from the Command Palette. Automatically called on unload.
       */
      removeCommand: (args: { label: string }) => void;
    };
  };
}

// Augment the global window object

// This allows using `extensionAPI` as a global-like constant in your extension's scope
// (e.g., in the function passed to `roamAlphaAPI.extension.js`).
// declare const extensionAPI: ExtensionAPI;

/**
 * 关键词数据接口 (无变化)
 */
interface Keyword {
  keyword: string;
  startIndex: number;
  endIndex: number; // 假设 endIndex 是包含的 (inclusive)
}

/**
 * 分组后的结果接口 (新增 text 字段)
 */
interface GroupedResultWithText {
  keywords: Keyword[];
  start: number;
  end: number;
  text: string; // 从原始文本中截取的、代表整个分组范围的字符串
}
