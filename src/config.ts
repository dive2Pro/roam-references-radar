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
            },
            {
                id: "ignore-not-completed-matches",
                name: "Ignore Not Completed Matches",
                description: "",
                action: {
                    type: 'switch',
                    onChange: (evt: { target: HTMLInputElement }) => {
                        console.log({ evt })
                        extensionAPI.settings.set("ignore-not-completed-matches", evt.target.checked);
                    }
                }
            },
            {
                // case insensitive
                id: "case-insensitive",
                name: "Case Insensitive",
                description: "",
                action: {
                    type: 'switch',
                    onChange: (evt: { target: HTMLInputElement }) => {
                        extensionAPI.settings.set("case-insensitive", evt.target.checked);
                    }
                }   
            }
        ]
    })
    // 如果 case-insensitive 未设置，则默认初始化 case-insensitive 为 true
    if (_extensionAPI.settings.get("case-insensitive") === null) {
        _extensionAPI.settings.set("case-insensitive", true);
        
    }
    console.log({ caseInsensitive: getCaseInsensitive() })
}

export function getCaseInsensitive() {
    return _extensionAPI.settings.get("case-insensitive");
}

export function getIgnoreKeywords() {
    return _extensionAPI.settings.get("ignore-keywords");
}

export function getIgnoreNotCompletedMatches() {
    return _extensionAPI.settings.get("ignore-not-completed-matches");
}