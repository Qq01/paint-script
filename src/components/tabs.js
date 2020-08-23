import {elem, text} from "../utils.js";

export function makeTabs(addTabBtn = true, ...tabsNames) {
    const tabClass = 'ps-tabs__tab';
    const tabSelectedClass = 'ps-tabs__tab--selected';
    const addTabClass = 'ps-tabs__add-tab';
    function addTab({dispatchEvents = true, name} = {}) {
        const index = $tabs.tabCount++;
        const $tab = elem('div', text(name ? name : index));
        $tab.dataset.name = name ? name : index;
        $tab.dataset.tabIndex = index;
        $tab.classList.add(tabClass);
        $tab.onclick = function(){selectTab(index)};
        if (addTabBtn) {
            $tabs.lastChild.insertAdjacentElement('beforebegin', $tab);
        } else {
            $tabs.appendChild($tab);
        }
        if (dispatchEvents) {
            $tabs.dispatchEvent(new CustomEvent('tabs:add', {detail: {index}}));
        }
        selectTab(index, {dispatchEvents});
    }
    function selectTab(index, {dispatchEvents = true} = {}) {
        const $prevTab = $tabs.querySelector(`.${tabSelectedClass}`);
        if ($prevTab) {
            $prevTab.classList.remove(tabSelectedClass);
        }
        const $nextTab = $tabs.querySelector(`.${tabClass}[data-tab-index="${index}"]`);
        if ($nextTab) {
            $nextTab.classList.add(tabSelectedClass);
            $tabs.selectedTabIndex = index;
        }
        if (dispatchEvents) {
            $tabs.dispatchEvent(new CustomEvent('tabs:change', {detail: {
                prevTabIndex: $prevTab && $prevTab.dataset.tabIndex ? Number.parseInt($prevTab.dataset.tabIndex) : null,
                nextTabIndex: $nextTab ? index : null,
                prevTabName: $prevTab?.dataset.name,
                nextTabName: $nextTab.dataset.name
            }}));
        }
    }
    function clearTabs() {
        $tabs.tabCount = 0;
        $tabs.selectedTabIndex = 0;
        $tabs.querySelectorAll(`.${tabClass}:not(.${addTabClass})`).forEach($t => {
            $tabs.removeChild($t);
        });
    }
    const $tabs = elem('div');
    if (addTabBtn) {
        const $addTab = elem('div', text('Add'));
        $addTab.onclick = addTab;
        $addTab.classList.add(addTabClass, tabClass);
        $tabs.appendChild($addTab);
    }
    $tabs.classList.add('ps-tabs');
    $tabs.addTab = e => addTab({dispatchEvents: false});
    $tabs.tabCount = 0;
    $tabs.selectedTabIndex = 0;
    if (tabsNames.length) {
        tabsNames.forEach(name => addTab({name}));
    } else {
        addTab();
    }                
    $tabs.clearTabs = clearTabs;
    $tabs.selectTab = selectTab;
    return $tabs;
}