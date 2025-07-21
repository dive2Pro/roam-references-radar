import { extension_helper } from "./helper";
import { initExtension } from "./extension";

declare global {
  interface Window {
    roamAlphaAPI: RoamAlphaAPI;
    extensionAPI: ExtensionAPI;
  }
}
function onload({ extensionAPI }: { extensionAPI: ExtensionAPI }) {
  initExtension(extensionAPI);
}

function onunload() {
  extension_helper.uninstall();
}

export default {
  onload,
  onunload,
};
