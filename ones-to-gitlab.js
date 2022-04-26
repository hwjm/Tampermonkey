// ==UserScript==
// @name         ones 创建议题
// @namespace    http://tampermonkey.net/
// @version      latest
// @description  try to take over the world!
// @author       You
// @match        https://ones.freshfood.cn/*
// @icon         https://ones.freshfood.cn/project/favicon2020.png
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery.md5@1.0.2/index.min.js
// @connect      fanyi.youdao.com
// @connect      dict.youdao.com
// @connect      shared.ydstatic.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

(function() {
    'use strict';

    const GITHUBINFOS = [
        {
            url: 'http://10.252.192.3',
            group: 'web',
            project: 'csx-app-rn-wms-tms',
            author: 'wjm'
        },
        {
            url: 'http://10.252.192.3',
            group: 'web',
            project: 'csx-wms-app-new',
            author: 'wjm'
        }
    ]

    /** 有道翻译 */
    const youdaoTrans = {
        sign: "",
        Execute: function (text, callback) {
            const h_url = "",
                h_headers = {},
                h_data = "";

            const youdaoTransApi = "http://fanyi.youdao.com/translate_o?client=fanyideskweb&keyfrom=fanyi.web&smartresult=dict&version=2.1&doctype=json";
            const tempsalt = "" + (new Date).getTime() + parseInt(10 * Math.random(), 10);
            const newSign = this.sign != "" ? this.sign : "]BjuETDhU)zqSxf-=B#7m";
            const tempsign = $.md5("fanyideskweb" + text + tempsalt + newSign);

            GM_xmlhttpRequest({
                method: 'POST',
                url: youdaoTransApi,
                headers: {"Content-Type": "application/x-www-form-urlencoded", "Referer": "http://fanyi.youdao.com/"},
                data: `from=AUTO&to=en&salt=${tempsalt}&sign=${tempsign}&i=${encodeURIComponent(text)}`,
                onload: function (r) {
                    setTimeout(function () {
                        const data = JSON.parse(r.responseText);
                        if (data.errorCode == 0) {
                            const [first] = data.translateResult;
                            const tran = first.reduce((p, c) => (p += c.tgt), "");
                            callback(tran);
                        }
                    }, 300);
                },
                onerror: function (e) {
                    console.error(e);
                }
            });
        },
        init: function () {
            GM_xmlhttpRequest({
                method: "GET",
                url: "http://fanyi.youdao.com/",
                timeout: 5000,
                onload: function (ydRes) {
                    //fanyijsUrlMatch正则匹配字符串  <script type="text/javascript" src="http://shared.ydstatic.com/fanyi/newweb/v1.0.29/scripts/newweb/fanyi.min.js"></script>
                    const fanyijsUrlMatch = /<script\s+type="text\/javascript"\s+src="([http|https]*?:\/\/shared.ydstatic.com\/fanyi\/newweb\/v[\d.]+\/scripts\/newweb\/fanyi.min.js)"><\/script>/g.exec(ydRes.responseText);
                    if (!fanyijsUrlMatch) {
                        console.log("获取fanyi.min.js失败！！！");
                    } else {
                        const fanyijsUrl = fanyijsUrlMatch[1];
                        if (typeof fanyijsUrl !== 'undefined') {
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: fanyijsUrl,
                                timeout: 5000,
                                onload: function (r) {
                                    //sign正则匹配字符串  sign:n.md5("fanyideskweb"+e+i+"]BjuETDhU)zqSxf-=B#7m")}};
                                    const signMatch = /sign:[a-z]{1}\.md5\("fanyideskweb"\+[a-z]{1}\+[a-z]{1}\+"(.*)"\)}};/g.exec(r.responseText);
                                    if (!signMatch) {
                                        console.log("获取sign失败！！！");
                                    } else {
                                        const newSign = signMatch[1];
                                        youdaoTrans.sign = newSign || "";
                                    }
                                },
                                onerror: function (e) {
                                    console.error(e);
                                }
                            });
                        }
                    }
                },
                onerror: function (e) {
                    console.error(e);
                }
            });
        }
    }

    /** MMdd时间 */
    const timeStr = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const monthStr = (month < 10 ? '0' : '') + month;
        const dateStr = (date < 10 ? '0' : '') + date;
        return monthStr + dateStr;
    }

    /** 转驼峰 */
    const toHump = text => text.toLowerCase().replace(/ (\w)/g, (all, letter) => letter.toUpperCase());

    /** 获取任务信息 */
    const getTaskInfo = function (callback) {
        let orginTitle = $('.task-base-title').text();
        let id = $('.task-basic-task-number').text().replace('#', '');
        const [href, path] = location.href.split('#');
        const params = path.split('/').filter(o => o);
        const teamId = params[params.findIndex(o => o === 'team') + 1];
        const taskId = params[params.findIndex(o => o === 'task') + 1];
        const link = `${href}%23/team/${teamId}/task/${taskId}`;

        const transTitle = orginTitle.replace('【', '').replace('】', '');
        const title = `【${orginTitle}】`;

        youdaoTrans.Execute(transTitle, en => {
            callback({ title, link, id, en });
        })
    }

    /** 生成github链接 */
    const createGitLink = function (taskInfo, githubInfo) {
        const { title, link, id, en } = taskInfo;
        const { url, group, project, author } = githubInfo;
        const gitlabTitle = `feature ${id} ${en} ${author} ${timeStr()} ${title}`;
        const result = `${url}/${group}/${project}/issues/new?issue[title]=${gitlabTitle}&issue[description]=[${title}](${link})`;
        return encodeURI(result);
    }

    const createIssueUl = (taskInfo) => {
        const lis = GITHUBINFOS.map((item) => {
            const link = createGitLink(taskInfo, item);
            return `<li class="ant-dropdown-menu-item"><a target="_blank" href=${link}>创建议题 ${item.project}</a></li>`;
        });

        return `<ul class="issue-list ant-dropdown-menu ant-dropdown-menu-vertical ant-dropdown-menu-light ant-dropdown-menu-root" style="position:absolute; right: -50px; margin-top: 10px;display: none;">${lis.join('')}<ul>`
    }

    /** 添加 issue 按钮 */
    const createIssueBtn = ()=>{
        if($('.issue-btn').length > 0) return;
        getTaskInfo(taskInfo => {
            const ul = createIssueUl(taskInfo);
            const issueMain = $(`<div style="position:relative; z-index:9"><div class="issue-btn ones-button ones-button-text" style="color: maroon;font-weight: 900;">[ISSUE]</div></div>`);
            issueMain.append(ul);
            const action = $('.ui-task-actions');
            action.prepend(issueMain);
        })

    }

    const bodyClick = (e) => {
        if(e && e.target&& $(e.target).hasClass('issue-btn')){
            $('.issue-list').toggle();
        }else {
            $('.issue-list').toggle(false);
            wait(0, 100, createIssueBtn);
        }
    }

    const wait = (index, total, func) => {
        //console.log('重试...', index);
        setTimeout(() => {
            if (index >= total || $('.issue-btn').length > 0) return;
            const condition = $('.ui-task-actions').length>0 && $('.task-base-title').length>0
            if (condition) {
                func();
            } else {
                wait(index+1, total, func)
            }
        }, 200)
    }

    /** 初始化 */
    const init = function () {
        youdaoTrans.init();
        $('body').click(bodyClick)
        $(document).ready(function(){
            if(location.href.indexOf('/task/') === -1) return
            wait(0, 100, createIssueBtn);
        });
    }

    init();
})();
