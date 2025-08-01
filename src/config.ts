let _extensionAPI: ExtensionAPI;
export function initConfig(extensionAPI: ExtensionAPI) {
    _extensionAPI = extensionAPI;
    extensionAPI.settings.panel.create({
        tabTitle: "Roam References Radar",
        settings: [
            {
                id: "ignore-keywords",
                name: "Ignore Keywords",
                description: "Ignore keywords",
                action: {
                    type: "input",
                    placeholder: 'Separated by ",", like [[keywords1]],[[keywords2]]',
                    onChange: (evt) => {
                        extensionAPI.settings.set("ignore-keywords", evt.target.value);
                        
                    }

                }
            }
        ]
    })
}

export function getIgnoreKeywords() {
    return _extensionAPI.settings.get("ignore-keywords");
}