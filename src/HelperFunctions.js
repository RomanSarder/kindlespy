/**
 * Created by Andrey Klochkov on 09.08.14.
 */

/**
 * Parses URL and returns a get parameter requested
 * @param url url to parse
 * @param name parameter name
 * @returns {string} parameter value
  */
function GetParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**
 * Returns default value if parameter is not passed to function, otherwise returns it's value.
 * @param param parameter
 * @param defaultValue default param value
 * @returns default value if parameter is not set
  */
function ValueOrDefault(param, defaultValue){
    return typeof param === "undefined" ? defaultValue : param;
}

/**
 * Returns substring between startChar and endChar after pattern in the text
 * @param text
 * @param pattern
 * @param startChar
 * @param endChar
 * @returns {string}
 */
function ParseString(text, pattern, startChar, endChar)
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
}

/**
 * Creates a concrete site parser object depending on URL
 * @param url
 * @returns {object} SiteParser
  */
function GetSiteParser(url){
    if(url.indexOf(AmazonComParser.MainUrl)!=-1)
        return new AmazonComParser();
    if(url.indexOf(AmazonCoUkParser.MainUrl)!=-1)
        return new AmazonCoUkParser();
    if(url.indexOf(AmazonDeParser.MainUrl)!=-1)
        return new AmazonDeParser();
}

/**
 * Add decimal and thousand delimiters: commas and points
 * @param str
 * @returns {string}
 */
function AddCommas(str)
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
}

/**
 * Gets a category from the bookData array
 * @param bookData
 * @returns {string}
 */
function GetCategoryFromBookData(bookData){
    bookData = ValueOrDefault(bookData, []);
    if(bookData.length > 0)
        return bookData[0].Category;

    return '';
}
/**
 * Return bool value page is best sellers.
 * @param Url
 * @returns {boolean}
 */
function IsBestSellersPage(Url){
    return (Url.indexOf(SiteParser.MainUrl +"/Best-Sellers-Kindle-Store") >= 0 && Url.indexOf("digital-text") > 0)
        || (Url.indexOf(SiteParser.MainUrl +"/gp/bestsellers") >= 0 && Url.indexOf("digital-text") > 0);
}
function IsBestSellersPageFromCategoryKind(categoryKind){
    return categoryKind.indexOf("Seller") != -1;
}/**
 * Return bool value page is search page.
 * @param Url
 * @returns {boolean}
 */
function IsSearchPage(Url){
    console.log(Url);
    return Url.indexOf(SiteParser.MainUrl +"/s/")==0 && Url.indexOf("digital-text") > 0;
}
function IsSearchPageFromCategoryKind(categoryKind){
    return categoryKind.indexOf("Search") != -1;
}/**
 * Return bool value page is author page.
 * @param Url
 * @returns {boolean}
 */
function IsAuthorPage(){
    return document.documentElement.innerHTML.indexOf(SiteParser.AreYouAnAuthorPattern) >= 0 && document.documentElement.innerHTML.indexOf("ap-author-name") >= 0;
}
/**
 * Return bool value page is single page.
 * @param Url
 * @returns {boolean}
 */
function IsSingleBookPage(Url){
    var fullUrl = Url.split("/");
    var mainUrl = fullUrl[0] +"//"+ fullUrl[2];
    return (mainUrl.indexOf(SiteParser.MainUrl) >=0 && fullUrl[4].indexOf("dp") >= 0);
}

function SetupHeader(category, categoryKind){
    $('#KeywordAnalysisMenu').hide();
    if (IsBestSellersPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("Best Sellers in");
        $("#title").html(category + ':');
        $('#BestSellerLink').html('Best Seller Rankings');
        return;
    }
    if(IsSearchPageFromCategoryKind(categoryKind)){
        $("#CategoryKind").html("Keyword:");
        $("#title").html(category);
        $('#KeywordAnalysisMenu').show();
        $('#BestSellerLink').html('Keyword Results');
        return;
    }
    $("#CategoryKind").html("Author:");
    $("#title").html(category);
    $('#BestSellerLink').html('Author Titles');
}

function BuildHeaderHtml(rankTrackingNum){
    var headerHtml = '<div style="float:left;font-size:14px;padding-left:11px;" id="CategoryKind"></div>' +
        '<div style="float:left;font-size:14px;padding-left:6px;font-weight:bold" id="title"></div>' +
        '<div style="float:right">' +
        '<a id="BestSellerLink" href="#"></a>&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<span style="display: none;" id="KeywordAnalysisMenu"><a id="KeywordAnalysis" href="#">Keyword Analysis</a>&nbsp;&nbsp;|&nbsp;&nbsp;</span>' +
        '<a id="TitleWordCloud" href="#">Titles Cloud (20)</a>&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<a id="RankTrackingResultList" href="#">Rank Tracking (' + rankTrackingNum + ')</a>' +
        '</div>';
    return headerHtml;
}

function trimCurrentUrl(currentPageUrl){
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
}