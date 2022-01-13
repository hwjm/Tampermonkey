// ==UserScript==
// @name         Tapd创建议题
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.tapd.cn/*/prong/stories/view/*
// @icon         https://www.tapd.cn/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/jquery.md5@1.0.2/index.min.js
// @connect      fanyi.youdao.com
// @connect      dict.youdao.com
// @connect      shared.ydstatic.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    var GITHUBINFOS = [
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
    var youdaoTrans = {
        sign: "",
        Execute: function (text, callback) {
            var h_url = "",
                h_headers = {},
                h_data = "";

            var youdaoTransApi = "http://fanyi.youdao.com/translate_o?client=fanyideskweb&keyfrom=fanyi.web&smartresult=dict&version=2.1&doctype=json";
            var tempsalt = "" + (new Date).getTime() + parseInt(10 * Math.random(), 10);
            var newSign = this.sign != "" ? this.sign : "]BjuETDhU)zqSxf-=B#7m";
            var tempsign = $.md5("fanyideskweb" + text + tempsalt + newSign);

            GM_xmlhttpRequest({
                method: 'POST',
                url: youdaoTransApi,
                headers: {"Content-Type": "application/x-www-form-urlencoded", "Referer": "http://fanyi.youdao.com/"},
                data: `from=AUTO&to=en&salt=${tempsalt}&sign=${tempsign}&i=${encodeURIComponent(text)}`,
                onload: function (r) {
                    setTimeout(function () {
                        var data = JSON.parse(r.responseText);
                        if (data.errorCode == 0) {
                            var [first] = data.translateResult;
                            var tran = first.reduce((p, c) => (p += c.tgt), "");
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
                    var fanyijsUrlMatch = /<script\s+type="text\/javascript"\s+src="([http|https]*?:\/\/shared.ydstatic.com\/fanyi\/newweb\/v[\d.]+\/scripts\/newweb\/fanyi.min.js)"><\/script>/g.exec(ydRes.responseText);
                    if (!fanyijsUrlMatch) {
                        console.log("获取fanyi.min.js失败！！！");
                    } else {
                        var fanyijsUrl = fanyijsUrlMatch[1];
                        if (typeof fanyijsUrl !== 'undefined') {
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: fanyijsUrl,
                                timeout: 5000,
                                onload: function (r) {
                                    //sign正则匹配字符串  sign:n.md5("fanyideskweb"+e+i+"]BjuETDhU)zqSxf-=B#7m")}};
                                    var signMatch = /sign:[a-z]{1}\.md5\("fanyideskweb"\+[a-z]{1}\+[a-z]{1}\+"(.*)"\)}};/g.exec(r.responseText);
                                    if (!signMatch) {
                                        console.log("获取sign失败！！！");
                                    } else {
                                        var newSign = signMatch[1];
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
    var timeStr = () => {
        var now = new Date();
        var month = now.getMonth() + 1;
        var date = now.getDate();
        var monthStr = (month < 10 ? '0' : '') + month;
        var dateStr = (date < 10 ? '0' : '') + date;
        return monthStr + dateStr;
    }

    /** 转驼峰 */
    var toHump = text => text.toLowerCase().replace(/ (\w)/g, (all, letter) => letter.toUpperCase());

    /** 获取任务信息 */
    var getTaskInfo = function (callback) {
        var titleElement = document.getElementById('title-copy-btn-new');
        var [title, subLink] = titleElement.dataset.clipboardText.split(' https://');
        var link = 'https://' + subLink;
        var idElement = document.getElementById('copy_id_new');
        var id = idElement.dataset.clipboardText;
        var orginTitle = title.replace('【', '').replace('】', '');
        youdaoTrans.Execute(orginTitle, en => {
            callback({ title, link, id, en });
        })
    }

    /** 生成github链接 */
    var createGitLink = function (taskInfo, githubInfo) {
        var { title, link, id, en } = taskInfo;
        var { url, group, project, author } = githubInfo;
        var gitlabTitle = `feature ${id} ${en} ${author} ${timeStr()} ${title}`;
        var result = `${url}/${group}/${project}/issues/new?issue[title]=${gitlabTitle}&issue[description]=[${title}](${link})`;
        return encodeURI(result);
    }

    /** 创建li标签 */
    var creaetLiElement = function (title, link) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.text = title;
        a.href = link;
        a.target = '_blank';
        a.className = 'clipboard-btn';
        li.appendChild(a);
        return li
    }

    /** 初始化 */
    var init = function () {
        youdaoTrans.init();
        var lastElement = document.getElementById('svn_keyword_new').parentElement;

        getTaskInfo(taskInfo => GITHUBINFOS.forEach(githubInfo => {
            var { project } = githubInfo;
            var link = createGitLink(taskInfo, githubInfo);
            var li = creaetLiElement(`创建议题[${project}]`, link);
            lastElement.append(li);
        }));
    }

    init();
})();
