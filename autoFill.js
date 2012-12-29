/*
 * autor : Jerrod Zhou (hehe123)
 * qq : 241728923
 * mail : mag.zhoujie@gmail.com
 * 
 */
$.fn.autoFill = function(opts){
    var $t = this,
        t = $t[0];
    if ($t.attr('data-autoFillHadInit') === 'true') {
        return;
    }
    var status_isTextarea = /textarea/i.test(t.nodeName),
        status_isInputTxt = /input/i.test(t.nodeName) && /text/i.test(t.type);
    if(!status_isTextarea && !status_isInputTxt){
        return this;
    }
    var doc = document,
        $doc = $(doc),
        $body = $(doc.body),
        elms_valBox = $([
            '<span class="autoFill-valBox">',
                '<div class="autoFill-valTipCo '+ (status_isTextarea ? 't-textarea' : 't-inputtxt') +'"><\/div>',
            '</span>'    
        ].join('')).insertAfter($t).find('> .autoFill-valTipCo'),
        elms_valTip = $('<pre class="autoFill-valTip"></pre>').appendTo($body),
        elms_getSize = null,
        data_typeTxt = '',
        data_typeContent = [],
        data_typeKeyMap = {},
        data_oldCurPos,
        data_txtIdx = -1,
        data_txtLen = 0,
        data_oldSearchCo = '',
        data_newSearchCo = '',
        data_afterVal = opts.afterVal || '',
        data_markKey = opts.markKey || ';',
        data_defaultData = opts.defaultData,
        status_hasDefaultData = opts.defaultData ? true : false,
        status_searchingTxt = false,
        status_hadValTipShow = false,
        status_canElementResize = opts.canResize || false,
        status_isOnKeyDown = false;
    
    if (status_isInputTxt) {
        elms_getSize = $('<span class="autoFill-valTipSize"></span>').appendTo(elms_valBox.parents('.autoFill-valBox'));
    }    
    
    !$t.hasClass('autoFill_typeBox') && $t.addClass('autoFill_typeBox'); 
    $t.attr('data-autoFillHadInit', 'true');
    var styleArr = ['text-indent', 'text-align', 'height', 'width', 'padding', 'border', 'font', 'font-family', 'font-size', 'font-weight', 'line-height', 'word-wrap', 'word-break', 'white-space', 'word-spacing', 'letter-spacing'],
        i = 0,
        ni = styleArr.length;
    /*
     * for old IE, need to add font-size, font-weight after font.
     */    
    for (; i < ni; i++) {
        var _ = styleArr[i];
        elms_valBox.css(_, $t.css(_));
    }
    function methods_replaceHtmlCode(str) {
        return str.replace(/\<s/gi, '%s').replace(/\<\/s/gi, '%/s').replace(/\t>/gi, 't%');
    }
    function methods_searchDefaultdata(searchCo, data_oldCurPos, sel_e) {
        var arr = [];
        for (i = 0, ni = data_defaultData.length; i < ni; i++) {
            if (RegExp(searchCo).test(data_defaultData[i])) {
                arr.push(data_defaultData[i]);
            }
        }
        if (arr.length >= 1) {
            var newData = opts.rulels ? opts.rules(arr) : arr;
            methods_createValTipContent(newData, data_oldCurPos, sel_e);
        } else {
            methods_hideValTip();
        }
    }
    function methods_searchOutData(searchCo, data_oldCurPos, sel_e) {
        opts.searchFunc && opts.searchFunc({
            txt : searchCo,
            success : function(data) {
                var newData = opts.rulels ? opts.rules(data) : data;
                methods_createValTipContent(newData, data_oldCurPos, sel_e);
            },
            error : function() {
                methods_hideValTip();
            }
        });
    }
    function methods_hideValTip() {
        data_oldCurPos = 0;
        elms_valTip.hide().html('');
        status_hadValTipShow = false;
        status_searchingTxt = false;
        $doc.unbind('mousedown', methods_docMousedown);
    }
    function methods_setValTipPosition(pos_s, pos_e) {
        var val = $t.val(),
            s0 = methods_replaceHtmlCode(val.slice(0, pos_s)),
            s1 = val.slice(pos_s, pos_e),
            tScrollTop = t.scrollTop,
            tScrollLeft = t.scrollLeft;
        elms_valBox.html(s0 + '<a href="javascript:void(0)">'+ s1 +'</a>');
        var a = elms_valBox.find('a'),
            a0 = a[0],
            a0_t = a0.offsetTop,
            a0_l = a0.offsetLeft;
        return [a0_l - tScrollLeft, a0_t - tScrollTop, a.height()];
    }
    function methods_focusElmOfValTip(dir) {
        elms_valTip.find('li[class=selected]').removeClass('selected');
        if (dir === 'up') {
            if (data_txtIdx === -1) {
                return;
            } else {
                data_txtIdx --;
                data_txtIdx !== -1 && elms_valTip.find('li').eq(data_txtIdx).addClass('selected');
            }
        } else {
            if (data_txtIdx === data_txtLen) {
                return;
            } else {
                data_txtIdx ++;
                data_txtIdx !== data_txtLen && elms_valTip.find('li').eq(data_txtIdx).addClass('selected');
            }
        }
    }
    function methods_hoverElmOfValTip(e) {
        var target = e.target,
            $target = $(target);
        if ($target.hasClass('selected')) {
            return;
        }    
        if (target && target.nodeName === 'LI') {
            elms_valTip.find('li[class=selected]').removeClass('selected');
            $target.addClass('selected');
            data_txtIdx = +$target.attr('data-valIdx');
        }
    }
    function methods_createValTipContent(arr, pos_s, pos_e) {
        if (arr && arr.length) {
            i = 0;
            data_txtLen = ni = arr.length;
            var html = '<ul>',
                pro = methods_setValTipPosition(pos_s, pos_e);
            for (; i < ni; i++) {
                var _ = arr[i];
                html += '<li title="'+ _ +'" data-valIdx="' + i + '">' + (_.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;')) + '</li>';
            } 
            elms_valTip.html(html).css({
                left : t.offsetLeft + pro[0] + 'px',
                top : t.offsetTop + pro[1] + pro[2] + 'px'   
            }).show();
            status_hadValTipShow = true;
            data_txtIdx = -1;
            $doc.bind('mousedown', methods_docMousedown);
        }
    }
    function methods_typeBoxKeyUp(e) {
        var k = e.keyCode,
            val = $t.val();
        data_typeTxt = $t.val();
        data_typeKeyMap[k] = false;
        if (val !== '') {
            var sel = $t.getSelectionPos();
            var lastKey = data_typeTxt.slice(sel.s - 1, sel.e);
            if (lastKey === '' && sel.s !== 0 && data_typeTxt.slice(sel.s - 2, sel.e - 1) === data_markKey) {
                data_oldCurPos = sel.s - 1;
                status_searchingTxt = true;
            } else if (lastKey === data_markKey) {
                data_oldCurPos = sel.s;
                status_searchingTxt = true;
            }
            if (status_searchingTxt) {
                data_newSearchCo = data_typeTxt.slice(data_oldCurPos, sel.e);
                if (data_newSearchCo === data_oldSearchCo || RegExp(data_markKey).test(data_newSearchCo)) {
                    return;
                }
                elms_valTip.hide().html('');
                status_hadValTipShow = false;
                data_oldSearchCo = data_newSearchCo;
                if (data_newSearchCo !== '') {
                    status_hasDefaultData ? methods_searchDefaultdata(data_newSearchCo, data_oldCurPos, sel.e) : methods_searchOutData(data_newSearchCo, data_oldCurPos, sel.e);
                }
            } else {
                elms_valTip.hide().html('');
                $doc.unbind('mousedown', methods_docMousedown);
            }
        }
    }
    function methods_typeBoxKeyDown(e) {
        var k = e.keyCode,
            val = $t.val();
        data_typeKeyMap[k] = true;
        data_typeTxt = val;
        //clearTimeout(data_clearSearchRec);
        /*
         * 32 - block
         * 13 - enter
         * 188 - ,
         * 186 - ;
         * 8 - backspace
         * 38 - up
         * 40 - down
         * 46 - delete
         * 27 - ese
         */
        if (val !== '') {
            if (/^(38|40)$/.test(k) && status_hadValTipShow) {
                methods_focusElmOfValTip(38 === k ? 'up' : 'down');
                return false;
            }
            if ((13 === k || 8 === k) && status_hadValTipShow) {
                if (data_txtIdx !== -1 && data_txtIdx !== data_txtLen) {
                    var tVal = elms_valTip.find('li').eq(data_txtIdx).attr('title') + data_afterVal,
                        tLen = tVal.length,
                        newCurPos = data_oldCurPos + tLen;
                    $t.val(val.slice(0, data_oldCurPos) + tVal + val.slice($t.getSelectionPos().e, val.length));
                    $t.setSelectionPos(newCurPos, newCurPos);
                    if (status_isInputTxt) {
                        elms_getSize.html(tVal);
                        t.scrollLeft += elms_getSize.width();
                    }
                    methods_hideValTip();    
                    return false;
                }
            }
            if (27 === k && status_hadValTipShow) {
                methods_hideValTip();
                return false;
            }
        }
    }
    function methods_docMousedown(e) {
        var target = e.target,
            $target = $(target);
        if (target && target.nodeName === 'LI' && $target.parents('.autoFill-valTip')[0]) {
            var val = $t.val(),
                tVal = $target.attr('title') + data_afterVal,
                tLen = tVal.length,
                newCurPos = data_oldCurPos + tLen;
            $t.val(val.slice(0, data_oldCurPos) + tVal + val.slice($t.getSelectionPos().e, val.length));
            $t.setSelectionPos(newCurPos, newCurPos);
            if (status_isInputTxt) {
                elms_getSize.html(tVal);
                t.scrollLeft += elms_getSize.width();
            }
        }
        methods_hideValTip();
    }
    elms_valTip.mouseover(methods_hoverElmOfValTip);
    $t.keyup(methods_typeBoxKeyUp).keydown(methods_typeBoxKeyDown);
    return this;
};
/*
 * jQuery
 * to set a new position for cursor pointer
 * s : number - the begin position
 * e : number - the end position
 * 
 * s & e can as a same number
 */
$.fn.setSelectionPos = function(s, e) {
    var t = this[0];
    if(t.selectionStart  ==  undefined){
        var txtRanage = t.createTextRange();
        txtRanage.move('character', s);
        e && txtRanage.moveEnd('character', e - s);
        txtRanage.select();
    }else{
        t.selectionStart = s;
        t.selectionEnd = e || s;
    }
};
/*
 * jQuery
 * to get the current cursor position
 */
$.fn.getSelectionPos = function(){
    var s, e, t = this[0], range, stored_range;
    if(t.selectionStart  ==  undefined){
        var selection = document.selection;
        if (t.tagName.toLowerCase() !=  "textarea") {
            var val = this.val(), 
                range = selection.createRange().duplicate();
            range.moveEnd("character",  val.length);
            s = (range.text  ==  "" ? val.length : val.lastIndexOf(range.text));
            range = selection.createRange().duplicate();
            range.moveStart("character",  -val.length);
            e = range.text.length;
        } else {
            range = selection.createRange();
            stored_range = range.duplicate();
            stored_range.moveToElementText(t);
            stored_range.setEndPoint('EndToEnd',  range);
            s = stored_range.text.length - range.text.length;
            e = s + range.text.length;
        }
    }else{
        s = t.selectionStart;
        e = t.selectionEnd;
    }
    var c = t.value.substring(s, e);
    return {s: s, e: e, c: c};
};    