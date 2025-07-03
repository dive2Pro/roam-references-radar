import { extension_helper } from "./helper";
import { initExtension } from "./extension";
import { initTopbarIcon } from "./topbar-icon";

declare global {
  interface Window {
    roamAlphaAPI: RoamAlphaAPI;
    extensionAPI: ExtensionAPI;
  }
}
function onload({ extensionAPI }: { extensionAPI: ExtensionAPI }) {
  initTopbarIcon(extensionAPI);
  initExtension();
}

function onunload() {
  extension_helper.uninstall();
}

export default {
  onload,
  onunload,
};
