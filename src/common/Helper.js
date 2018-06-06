/**
 * Created by Andrey Klochkov on 09.08.14.
 */

function Helper(){
}

Helper.parseFloat = function(string, decimalSeparator){
    if (typeof(string) !== 'string') return string;
    decimalSeparator = Helper.valueOrDefault(decimalSeparator, '.');
    // leave only numbers and decimal separator
    var numbersWithLocalDecimalSeparator = string.trim().replace(new RegExp('[^0-9' + decimalSeparator + ']','g'), '');
    return parseFloat(numbersWithLocalDecimalSeparator.replace(decimalSeparator, '.'));
};

Helper.parseInt = function(string, decimalSeparator){
    if (typeof(string) !== 'string') return string;
    decimalSeparator = Helper.valueOrDefault(decimalSeparator, '.');
    // leave only numbers and decimal separator
    return parseInt(string.trim().replace(new RegExp('[^0-9' + decimalSeparator + ']','g'), ''));
};

/**
 * Parses URL and returns a get parameter requested
 * @param url url to parse
 * @param name parameter name
 * @returns {string} parameter value
  */
Helper.getParameterByName = function(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

/**
 * Returns default value if parameter is not passed to function, otherwise returns it's value.
 * @param param parameter
 * @param defaultValue default param value
 * @returns default value if parameter is not set
 */
Helper.valueOrDefault = function(param, defaultValue){
    return typeof param === 'undefined' ? defaultValue : param;
};

/**
 * Returns substring between startChar and endChar after pattern in the text
 * @param text
 * @param pattern
 * @param startChar
 * @param endChar
 * @returns {string}
 */
Helper.parseString = function(text, pattern, startChar, endChar)
{
    var pos = text.indexOf(pattern);
    if (pos < 0) return "";

    var str = text.substr(pos + pattern.length);
    pos = str.indexOf(startChar);
    if (pos < 0) return "";

    str = str.substr(pos + startChar.length);
    pos = str.indexOf(endChar);
    if (pos < 0) return "";

    return str.substr(0, pos).trim();
};

/**
 * Creates a concrete site parser object depending on URL
 * @param url
 * @returns {object} SiteParser
 */
Helper.getSiteParser = function(url){
    var fullUrl = new URL(url);
    var hostname = fullUrl.hostname;
    if(hostname.indexOf('www.amazon.') == -1) return undefined;
    if(hostname.indexOf(AmazonAuParser.zone) != -1) //check earlier than AmazonComParser because AmazonComParser==com, but AmazonAuParser=com.au
        return new AmazonAuParser();
    if(hostname.indexOf(AmazonComParser.zone) != -1)
        return new AmazonComParser();
    if(hostname.indexOf(AmazonCoUkParser.zone) != -1)
        return new AmazonCoUkParser();
    if(hostname.indexOf(AmazonDeParser.zone) != -1)
        return new AmazonDeParser();
    if(hostname.indexOf(AmazonFrParser.zone) != -1)
        return new AmazonFrParser();
    if(hostname.indexOf(AmazonCaParser.zone) != -1)
        return new AmazonCaParser();
    if(hostname.indexOf(AmazonItParser.zone) != -1)
        return new AmazonItParser();
    if(hostname.indexOf(AmazonEsParser.zone) != -1)
        return new AmazonEsParser();
    if(hostname.indexOf(AmazonInParser.zone) != -1)
        return new AmazonInParser();
    if(hostname.indexOf(AmazonJpParser.zone) != -1)
        return new AmazonJpParser();
};

/**
 * Add decimal and thousand delimiters: commas and points
 * @param str
 * @returns {string}
 */
Helper.addCommas = function(str)
{
    str += '';
    x = str.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};

/**
 * Gets a category from the bookData array
 * @param bookData
 * @returns {string}
 */
Helper.getCategoryFromBookData = function(bookData){
    bookData = Helper.valueOrDefault(bookData, []);
    if(bookData.length > 0)
        return bookData[0].Category;

    return '';
};

/**
 * Return bool value page is best sellers.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isBestSellersPage = function(url, siteParser){
    return (url.indexOf(siteParser.mainUrl +"/Best-Sellers-Kindle-Store") >= 0 && url.indexOf("digital-text") > 0)
        || (url.indexOf(siteParser.mainUrl +"/gp/bestsellers") >= 0 && url.indexOf("digital-text") >= 0)
        || (url.indexOf(siteParser.mainUrl + "/gp/bestsellers") >= 0 && url.indexOf("books") >= 0)
        || (url.indexOf(siteParser.mainUrl + "/best-sellers-books-Amazon") >= 0 && url.indexOf("books") >=0)
};

/**
 * Return bool value page is new releases.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isNewReleasesPage = function(url, siteParser){
    return (url.indexOf(siteParser.mainUrl +"/gp/new-releases") >= 0 && (url.indexOf("digital-text") > 0 || url.indexOf("books")));
};

/**Return bool value is BestSellers page by categoryKind.
 * @param categoryKind
 * @returns {boolean}
 */
Helper.isBestSellersPageFromCategoryKind = function(categoryKind){
    return categoryKind.indexOf("Seller") != -1;
};

/**Return bool value is NewReleases page by categoryKind.
 * @param categoryKind
 * @returns {boolean}
 */
Helper.isNewReleasesPageFromCategoryKind = function(categoryKind){
    return categoryKind.indexOf("New-Releases") != -1;
};

/**
 * Return bool value page is search page.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isSearchPage = function(url, siteParser){
    return url.indexOf(siteParser.mainUrl +"/s/")!=-1 && (url.indexOf("digital-text") > 0 || url.indexOf("books") > 0);
};

/**
 * Return bool value is search page by categoryKind.
 * @param categoryKind
 * @returns {boolean}
 */
Helper.isSearchPageFromCategoryKind = function(categoryKind){
    return categoryKind.indexOf("Search") != -1;
};

/**
 * Return bool value page is author page.
 * @param html
 * @param siteParser
 * @returns {boolean}
 */
Helper.isAuthorPage = function(html, siteParser){
    return html.indexOf(siteParser.areYouAnAuthorPattern) >= 0 && html.indexOf("ap-author-name") >= 0;
};

/**
 * Return bool value page is author page.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isAuthorSearchResultPage = function(url, siteParser){
    return url.indexOf(siteParser.mainUrl +"/s") !=-1 && url.indexOf("field-author") > 0 && url.indexOf("digital-text") > 0;
};

/**
 * Return bool value page is single page.
 * @param url
 * @param siteParser
 * @returns {boolean}
 */
Helper.isSingleBookPage = function(url, siteParser){
    var fullUrl = url.split("/");
    var mainUrl = fullUrl[0] +"//"+ fullUrl[2];
    return (mainUrl.indexOf(siteParser.mainUrl) >= 0
        && fullUrl.length > 4
        && (fullUrl[4].indexOf("dp") >= 0)
        || fullUrl[3] === 'gp'
        || fullUrl[3].indexOf("dp") === 0);
};

/**
 * Parses html with replace of src tags to data-src
 * @param html
 * @returns {jQuery}
 */
Helper.parseHtmlToJquery = function(html){
    html = $.trim(html);
    html = html.replace(/src=/gi, "data-src=");
    return $(html);
};

/**
 * Setup header
 * @param category
 * @param categoryKind
 */
Helper.setupHeader = function(category, categoryKind){
    $('#KeywordAnalysisMenu').hide();
    if (Helper.isBestSellersPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("Best Sellers in");
        $("#title").html(category + ':');
        $('#BestSellerLink').html('Best Seller Rankings');
        return;
    }
    if (Helper.isNewReleasesPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("New Releases in");
        $("#title").html(category + ':');
        $('#BestSellerLink').html('New Releases Rankings');
        return;
    }
    if(Helper.isSearchPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("Keyword:");
        $("#title").html(category);
        $('#KeywordAnalysisMenu').show();
        $('#BestSellerLink').html('Keyword Results');
        return;
    }
    $("#CategoryKind").html("Author:");
    $("#title").html(category);
    $('#BestSellerLink').html('Author Titles');
};

/**
 * Setup footer
 * @param categoryKind
 */
Helper.setupFooter = function(categoryKind){
    $('#Conclusion').hide();
    $('#AdPanel').hide();
    if (Helper.isBestSellersPageFromCategoryKind(categoryKind)){
        $('#Conclusion').show();
        return;
    }
    if (Helper.isNewReleasesPageFromCategoryKind(categoryKind)){
        $('#Conclusion').show();
        return;
    }
    if(Helper.isSearchPageFromCategoryKind(categoryKind)){
        $('#Conclusion').show();
        return;
    }
    $('#AdPanel').show();
};

/**
 * Build html for header
 * @param rankTrackingNum
 * @returns {string}
 */
Helper.buildHeaderHtml = function(rankTrackingNum, cloudNum){
    var headerHtml = '<div style="float:left;font-size:14px;padding-left:11px;" id="CategoryKind"></div>' +
        '<div style="float:left;font-size:14px;padding-left:6px;font-weight:bold" id="title"></div>' +
        '<div style="float:right">' +
        '<a id="BestSellerLink" href="#"></a>&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<span style="display: none;" id="KeywordAnalysisMenu"><a id="KeywordAnalysis" href="#">Keyword Analysis</a>&nbsp;&nbsp;|&nbsp;&nbsp;</span>' +
        '<a id="TitleWordCloud" href="#">Word Cloud (' + cloudNum + ')</a>&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<a id="RankTrackingResultList" href="#">Rank Tracking (' + rankTrackingNum + ')</a>' +
        '</div>';
    return headerHtml;
};

/**
 * Return trimmed url
 * @param currentPageUrl
 * @returns {string}
 */
Helper.trimCurrentUrl = function(currentPageUrl){
    var currentUrl = currentPageUrl;
    if(currentPageUrl.indexOf('/s/') >= 0)
    {
        currentUrl = currentPageUrl.replace(/\&page=[0-9]+/, '');
    }
    else if (currentPageUrl.indexOf('/ref=') >= 0)
    {
        var _Pos = currentPageUrl.lastIndexOf('/ref=');
        currentUrl = currentPageUrl.substr(0, _Pos);
    }

    return currentUrl;
};

/**
 * Return bool value page is top100Free
 * @returns {boolean}
 */
Helper.isTop100Free = function(){
    return location.href.indexOf('tf=1') != -1;
};

/**
 * Return url for search page
 * @param keyword
 * @param siteParser
 * @returns {string}
 */
Helper.getSearchUrl = function(keyword, siteParser){
    return siteParser.mainUrl + "/s/url=search-alias%3Ddigital-text&field-keywords=" + encodeURI(keyword);
};

/**
 *
 * @param url of single book in list
 * @return url without /gp/slredirect/picassoRedirect.html
 */
Helper.getUrlWORedirect = function(url){
    if(typeof url === "undefined" || url.indexOf("picassoRedirect.html") === -1) return url;
    return decodeURIComponent(url.split("url=")[1]);
};

/**
 * @returns array of known book types
 */
Helper.getBookTypes = function() {
    return [
        'Paperback',
        'Hardcover',
        'Loose Leaf',
        'Spiral-bound',
        'Flexibound',
        'Plastic Comb',
        'Calendar',
        'Diary',
        'Mass Market Paperback',
        'Board Book',
    ]
}


/**
 * Return MD5 hash of given string
 * @param s
 * @returns {string} MD5 hash
 */
Helper.md5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

