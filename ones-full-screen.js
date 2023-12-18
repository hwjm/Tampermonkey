// ==UserScript==
// @name         ONES工作台隐藏筛选
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://ones.freshfood.cn/project/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=freshfood.cn
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery.md5@1.0.2/index.min.js
// @run-at       document-end
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

(function() {
    'use strict';

    var topbar_center = 'body > div.container > div > div > div > section > section > header > div.topbar-center';

    var common_detail_head = 'body > div.container > div > div > div > section > section > main > div > div.ot-layout-content.ot-layout-content-full.ot-layout-content-space-s.ot-layout-content-bg-white.ot-layout-content-for-app-main-content > div > div > div > div.common_detail_head';
    var task_list_top_bar = 'body > div.container > div > div > div > section > section > main > div > div.ot-layout-content.ot-layout-content-full.ot-layout-content-space-s.ot-layout-content-bg-white.ot-layout-content-for-app-main-content > div > div > div > div.common_detail_body.TaskList-body > div > div.view-port-left-top-bar.task-list-top-bar';
    var task_list_and_filter = 'body > div.container > div > div > div > section > section > main > div > div.ot-layout-content.ot-layout-content-full.ot-layout-content-space-s.ot-layout-content-bg-white.ot-layout-content-for-app-main-content > div > div > div > div.common_detail_body.TaskList-body > div > div.task-list-and-filter > div:nth-child(1)';

    const execTask = (jsPath, task) => {
        $(jsPath).length > 0 ? task() : setTimeout(() => execTask(jsPath, task), 500);
    }

    // 添加全屏按钮
    const addFullScreenButton = () => {
        execTask(topbar_center, () => {
            const status = localStorage.getItem('csx_ones_filter_status') || 'show';
            const button = $('<button>', {
                text: '',
                click: clickButton,
                id: 'csx_ones_filter_button',
                css: {
                    border: 'none',
                    background: 'none',
                    color: 'blue'
                }
            });
            $(topbar_center).after(button);
            changeVisible(status === 'show')
        })
    }

    // 按钮点击
    const clickButton = () => {
        const status = localStorage.getItem('csx_ones_filter_status');
        const nextStatus = status === 'hiden' ? 'show' : 'hiden';
        const visible = nextStatus === 'show';
        changeVisible(visible);
        localStorage.setItem('csx_ones_filter_status', nextStatus);
    }

    // 显示/隐藏
    const changeVisible = (visible) => {
        execTask(task_list_and_filter, () => {
            const list = [$(task_list_top_bar), $(task_list_and_filter)];

            list.forEach((item) => {
                visible ? item.show(): item.hide();
            });

            const title = visible ? '隐藏筛选': '显示筛选';
            $('#csx_ones_filter_button').text(title)
        })

    }

    addFullScreenButton();

})();
