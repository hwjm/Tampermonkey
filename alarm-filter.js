// ==UserScript==
// @name         线上报警过滤
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://wapi.freshfood.cn/exception/show/team?teamId=*
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    var titles = ['ID','产品名称','来源','异常产生','异常编码','异常标题','影响范围','异常内容','状态','操作项']
    var addToolBar = function() {
        var parent = document.getElementsByTagName("h3")
        var div = document.createElement('div')
        var select = document.createElement('select')
        var input = document.createElement('input')
        var btn = document.createElement('button')
        var reset = document.createElement('button')
        btn.innerHTML = '过滤'
        reset.innerHTML = '重置'
        // style
        input.style = 'height: 19px; margin-left: 5px; margin-right: 5px'
        select.style = 'height: 25px'
        btn.style = 'margin-right: 5px'
        // add subView
        var selectedIdx = GM_getValue('xsbjgl-cache')?.select || 0
        titles.forEach((item, idx) => {
            var option = document.createElement('option')
            if (selectedIdx == idx) option.selected = 'selected'
            option.value = idx
            option.innerHTML = item
            select.appendChild(option)
        })
        div.appendChild(select)
        input.value = GM_getValue('xsbjgl-cache')?.value || ''
        div.appendChild(input)
        div.appendChild(btn)
        div.appendChild(reset)
        parent[0].append(div)
        // click
        btn.onclick = (e) => {
            e.preventDefault()
            filter(input.value, select.value, true)
            GM_setValue('xsbjgl-cache', { value: input.value, select: select.value })
        }
        reset.onclick = (e) => {
            e.preventDefault()
            input.value = ''
            filter('', 0, false)
        }
    }
    var filter = function(key, idx, select) {
        var tbody = document.getElementsByTagName('tbody')[0]
        var trs = tbody.getElementsByTagName('tr')
        for (var i = 1; i < trs.length; i++) {
            if (trs[i].children[idx].innerText.indexOf(key) !== -1) {
                trs[i].style = null
                trs[i].children[0].children[0].checked = select
            } else {
                trs[i].style.display = 'none'
            }
        }
    }

    addToolBar();
})();
