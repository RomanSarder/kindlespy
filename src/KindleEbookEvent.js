/**
 * Created by Jang on 4/28/14.
 */


var defaultSetting = {
    "version": "0.0.0",
    "IsPulling" : false,
    "CurrentUrl" : "",
    "PageNum" : {MainTab: "1", KeywordAnalysisTab: "1"},
    "MainUrl": "http://www.amazon.com/",
    "ParamUrlBestSellers" : "154606011",
    "TYPE" : "", // can be 'single' or empty
    "TotalResults":"",
    "Book":
        [
            //{"No": "", "Url":"", "ParentUrl":"", "NextUrl": "", "Title":"", "Description":"", "Price": "", "EstSales": "", "SalesRecv": "", "Reviews": "", "SalesRank": "", "Category": "", "CategoryKind":"Seller", "PrintLength":"", "Author":"", "DateOfPublication":"", "GoogleSearchUrl":"", "GoogleImageSearchUrl":"", "Rating":""}
        ]
};

var customStorage={};
function getStorage(){
    return customStorage;
}

function getSetting()
{
    var a = getStorage().settings;
    return a = a ? JSON.parse(a) : defaultSetting
}

function RemoveSettings(url, parentUrl, IsFree)
{
    var setting = getSetting();

    var bookInfolen = setting.Book.length;


    var bIsFind = false;

    for (var i = bookInfolen - 1; i >=0 ; i--)
    {
        if (parentUrl === setting.Book[i].ParentUrl)
        {
            setting.Book.splice(i, 1);
        }
    }
    setting = defaultSetting;
    getStorage().settings = JSON.stringify(setting);
}

function SaveSettings(num, url, parentUrl, nextUrl, title, description, price, estsales, salesRecv, Reviews, salesRank, category, categoryKind, printLength, author, dateOfPublication, googleSearchUrl, googleImageSearchUrl, rating)
{
    var setting = getSetting();

    var bookInfolen = setting.Book.length;


    var bIsFind = false;

    var nTmp = 0;
    for (var i = 0; i < bookInfolen; i++)
    {
        if (title === setting.Book[i].Title && categoryKind === setting.Book[i].CategoryKind)
        {
            setting.Book[i].No = num;
            setting.Book[i].Title = title;
            setting.Book[i].Description = description;
            setting.Book[i].Price = price;
            setting.Book[i].EstSales = estsales;
            setting.Book[i].SalesRecv = salesRecv;
            setting.Book[i].Reviews = Reviews;
            setting.Book[i].SalesRank = salesRank;
            setting.Book[i].Category = category;
            setting.Book[i].Url = url;
            setting.Book[i].PrintLength = printLength;
            setting.Book[i].Author = author;
            setting.Book[i].DateOfPublication = dateOfPublication;
            setting.Book[i].GoogleSearchUrl = googleSearchUrl;
            setting.Book[i].GoogleImageSearchUrl = googleImageSearchUrl;
            setting.Book[i].Rating = rating;

            bIsFind = true;
            //break;
        }

    }

    if (!bIsFind)
    {
        var settingTmp = {"No": num, "Url": url, "ParentUrl": parentUrl, "NextUrl": nextUrl,  "Title": title, "Description": description, "Price": price, "EstSales": estsales, "SalesRecv": salesRecv, "Reviews": Reviews, "SalesRank": salesRank, "Category": category, "CategoryKind": categoryKind, "PrintLength": printLength, "Author":author, "DateOfPublication":dateOfPublication, "GoogleSearchUrl":googleSearchUrl, "GoogleImageSearchUrl":googleImageSearchUrl, "Rating":rating};

        setting.Book.push(settingTmp);
    }

    getStorage().settings = JSON.stringify(setting);
}

function SavePageNum(pageNum, tabName)
{
    var setting = getSetting();
    setting.PageNum[tabName] = pageNum;
    getStorage().settings = JSON.stringify(setting);
}
function SaveUrlParams(url, urlParamBestSellers)
{
    var setting = getSetting();
    setting.MainUrl = url;
    setting.ParamUrlBestSellers = urlParamBestSellers;
    getStorage().settings = JSON.stringify(setting);
}

function SaveTotalResults(totalResults)
{
    var setting = getSetting();
    setting.TotalResults = totalResults;
    getStorage().settings = JSON.stringify(setting);
}

var CurrentTabUrl;
var CurrentTabID;

chrome.runtime.onMessage.addListener(onMessageReceived);

function onMessageReceived(request, sender, callback){
    callback = ValueOrDefault(callback, function(){});
    if(request.page !== undefined)
        return callback(startPulling(request.page));

    if ("remove-settings" === request.type)
    {
        RemoveSettings(request.Url, request.ParentUrl, request.IsFree);
        return callback({});
    }

    if ("get-settings" === request.type)
    {
        return callback({
            settings: getSetting()
        });
    }

    if ("save-settings" === request.type)
    {
        SaveSettings(request.No, request.URL, request.ParentURL, request.NextUrl, request.Title, request.Description, request.Price, request.EstSales, request.SalesRecv, request.Reviews, request.SalesRank, request.Category, request.CategoryKind, request.PrintLength, request.Author, request.DateOfPublication, request.GoogleSearchUrl, request.GoogleImageSearchUrl, request.Rating);
        return callback({});
    }

    if ("save-PageNum" === request.type)
    {
        SavePageNum(request.PageNum, request.tab);
        return callback({});
    }

    if ("get-PageNum" === request.type)
    {
        var setting = getSetting();
        return callback({PageNum:setting.PageNum[request.tab]});
    }

    if ("save-UrlParams" === request.type)
    {
        SaveUrlParams(request.MainUrl, request.ParamUrlBestSellers);
        return callback({});
    }

    if ("set-current-Tab" === request.type)
    {
        CurrentTabUrl = location.href;
        return callback({});
    }

    if ("get-current-Tab" === request.type)
    {
        return callback({URL: CurrentTabUrl, ID: CurrentTabID});
    }

    if ("set-type-page" === request.type)
    {
        var setting = getSetting();
        setting.TYPE = request.TYPE;
        getStorage().settings = JSON.stringify(setting);
        return callback({});
    }

    if ("get-type-page" === request.type)
    {
        var setting = getSetting();
        return callback({TYPE:setting.TYPE});
    }

    if ("set-IsPulling" === request.type)
    {
        var setting = getSetting();
        setting.IsPulling = request.IsPulling;
        getStorage().settings = JSON.stringify(setting);
        return callback({});
    }

    if ("get-IsPulling" === request.type)
    {
        var setting = getSetting();
        return callback({IsPulling: setting.IsPulling});
    }

    if ("save-TotalResults" === request.type)
    {
        SaveTotalResults(request.TotalResults);
        return callback({});
    }

    if ("get-TotalResults" === request.type)
    {
        var setting = getSetting();
        return callback({TotalResults:setting.TotalResults});
    }
}

chrome.runtime.sendMessage('getVersion', function (version){
    var currentVersion = version;
    var savedVersion = getSetting().version;

    if (typeof savedVersion === "undefined" || currentVersion !== savedVersion)
    {
        defaultSetting.version = currentVersion;
        getStorage().settings = JSON.stringify(defaultSetting);
    }
});


//______________________________________________________________________________________________________________________
var ParentUrl;
var SiteParser;
var BookStore;
var SearchKeyword = '';

$(window).ready(function () {
    var Url = location.href;
    ParentUrl = trimCurrentUrl(Url);
    SiteParser = GetSiteParser(Url);
    BookStore = new BookStorage();
    BookStore.TrackData();
    setInterval("BookStore.TrackData()", 2*60*60*1000);

    if (SiteParser === undefined) return;
    if (Url.indexOf(SiteParser.MainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0) return;

    // Amazon search form
    $(".nav-searchbar").submit(function()
    {
        SearchKeyword = '';
        ContentScript.sendMessage({type: "remove-settings", ParentUrl: ParentUrl}, function(){
            if (SearchResultsPager) SearchResultsPager.stop();
            SearchResultsPager = undefined;
            PagesPulled = 0;
            setTimeout("processWhenDone()", 500);
        });
    });
    ContentScript.sendMessage({type: "set-type-page", TYPE: ''});
    ContentScript.sendMessage({type: "remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: true});

    startPulling(1);
});

function ContentScript(){
}

ContentScript.sendMessage = function(message, callback){
    return onMessageReceived(message, null, callback);
};

function GetNoInfo(responseText)
{
    return ParseString(responseText, 'class="zg_rankNumber"', ">", ".");
}

function GetPriceInfo(responseText)
{
    return ParseString(responseText,'class="price"', ">", "<");
}

function GetPageUrl(responsneText)
{
    return ParseString(responsneText, 'class="zg_title"', 'href="', '"');
}

function GetReviewrInfo(responseText)
{
    var pattern = "a href";
    var str = responseText;
    var pos = str.indexOf(pattern);

    var review = "";

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        review = ParseString(str, "product-reviews", '>', '<');
        if (typeof review !== "undefined" && review.length > 0) return review;

        pos = str.indexOf(pattern);
    }

    return "0";
}

function GetCategoryInfo(responseText)
{
    return ParseString(responseText, 'class="category"', '>', '<');
}

// AsyncRunner class
var AsyncRunner = {
    itemsInProgress: 0,
    finished: function(){
    },
    itemLoaded: function(){
        ContentScript.sendMessage({type:"set-IsPulling", IsPulling: false});
    },
    start: function(worker){
        var _this = this;
        _this.itemsInProgress++;
        worker(function(){
            _this.itemsInProgress--;
            _this.itemLoaded();
            if(_this.itemsInProgress == 0) {
                _this.finished();
            }
        });
    }
};

function ParseBestSellersPage(responseText, parentUrl, IsFree)
{
    var pattern = 'class="zg_itemImmersion"';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var index = 0;
    var bIsExist = [];
    category = GetCategoryInfo(str).trim();

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        No[index] = GetNoInfo(str);
        url[index] = GetPageUrl(str);
        price[index] = GetPriceInfo(str);
        review[index] = GetReviewrInfo(str);

        pos = str.indexOf(pattern);
        index++;
    }

    ContentScript.sendMessage({type:"get-settings"}, function(response){
        url.forEach(function(item, i) {
            if(url[i] !== undefined){
                AsyncRunner.start(function(callback){
                    function wrapper(){
                        parseDataFromBookPageAndSend(No[i], url[i], price[i], parentUrl, "", review[i], category, "Seller", callback);
                    }
                    setTimeout(wrapper, i*1000);
                })
            }
        });
    });
}

function GetAuthorCategory(responseText)
{
    return ParseString(responseText, 'EntityName', '<b>', '</b>');
}

function ParseAuthorPage(startIndex, maxResults, responseText, parentUrl)
{
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var counter = 0;
    var index = 0;

    $(responseText).find(".results").children().each(function() {
        if(this.id == "result_"+(startIndex+counter)) {
            if(counter>=maxResults) return;
            var krow = SiteParser.GetKindleEditionRow($(this));
            No[index] = parseInt(index) + 1 + parseInt(startIndex);
            if(typeof krow == "undefined"){
                counter++;
                return;
            }

            url[index] = SiteParser.GetUrlFromKindleEditionRow(krow);
            review[index] = SiteParser.GetReviewsCountFromResult($(this));
            if(!review[index]) review[index] = "0";
		    var kprice = SiteParser.GetPriceFromKindleEditionRow(krow);
		    if(kprice.length<1) {
			    kprice = $(krow).find(".toePrice a#buyPrice:first");
	    	}
	    	price[index] = $(kprice).text().trim();
            url[index] = url[index].replace("&amp;", "&");
            url[index] = url[index].replace(" ", "%20");
            counter++;
            index++;
        }
    });
    if(counter == 0) return 0;

    category = GetAuthorCategory(responseText).trim();

    if (typeof category === "undefined" || category.length < 1)
    {
        category = $(responseText).find("#entityHeader").text().trim();
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }

    url.forEach(function(item, i) {
        if (url[i] !== undefined && url[i].length > 0
            && price[i] !== undefined && price[i].length > 0){
            AsyncRunner.start(function(callback){
                function wrapper(){
                    parseDataFromBookPageAndSend(No[i], url[i], price[i], parentUrl, "", review[i], category, "Author", callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });

    return index;
}

function ParseSearchPage(startIndex, maxResults, responseText, parentUrl, search)
{
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category=search;

    var index = 0;
    var counter = 0;
    var result;

    var listItems = $.merge($(responseText).find("#centerPlus").has('.a-fixed-left-grid-inner'),
        $(responseText).find("#atfResults li").has('.a-fixed-left-grid-inner'));
    listItems = $.merge(listItems, $(responseText).find("#btfResults li").has('.a-fixed-left-grid-inner'));

    listItems.each(function() {
        if($(this).attr('id') !== 'result_'+(startIndex+index)
            && $(this).attr('id') !== 'centerPlus') return;
        result = $(this).find('.a-fixed-left-grid-inner');
        if(counter>=maxResults) return;
        No[index] = startIndex + index + 1;
        url[index] = $(result).find("a:first").attr("href");
        if(!url[index]) url[index] = "";
        var kprice = $(result).find('div').filter(function () {
            return $(this).text() == SiteParser.SearchPattern || $(this).children("a:contains(" + SiteParser.SearchPattern+ ")").length > 0;
        }).parent();
        price[index] = SiteParser.CurrencySign + "0" + SiteParser.DecimalSeparator + "00";
        if($(kprice).length > 0)
        var prices = kprice.find('span.s-price');
        var el_price;
        if (prices != undefined) {
            if ((prices.parent().parent().has('span.s-icon-kindle-unlimited').length > 0)
                || (prices.parent().has("span:contains('" + SiteParser.searchKeys[1] + "')").length > 0)) {
                el_price = $.grep(kprice.find('span.s-price'), function (element) {
                    return ($(element).parent().has("span:contains('" + SiteParser.searchKeys[0] + "')").length > 0);
                });
            }else if(prices.parent().parent().parent().has("h3:contains('Audible Audio Edition')").length > 0){ //Amazon Added Audible Audio Edition block
                el_price = $(prices[0]);
            }else if($(prices).length > 1){
                el_price = $(prices[0]);
            }else {
                el_price = kprice.find('span.s-price');
            }

            if( el_price.length > 0) price[index] = $(el_price).text().trim();
        }

        review[index] = undefined;

        url[index] = url[index].replace("&amp;", "&");
        url[index] = url[index].replace(" ", "%20");
        index++;
        counter++;
    });
    if(counter == 0) return 0;

    if (typeof category === undefined /*|| category.length < 1*/)
    {
        category = ParseString(responseText, 'entityHeader', '>', '<');
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }
    var totalResults = parseInt(SiteParser.GetTotalSearchResult(responseText).replace(/,/g,''));
    ContentScript.sendMessage({type:"save-TotalResults", TotalResults: totalResults});

    var purl = location.href.replace(/\&page=[0-9]+/, '');
    if (parentUrl !== purl) return;

    url.forEach(function(item, i) {
        if (url[i] !== undefined && url[i].length > 0
            && price[i] !== undefined && price[i].length > 0){
            AsyncRunner.start(function(callback){
                function wrapper(){
                    if (search != SearchKeyword) return;
                    parseDataFromBookPageAndSend(No[i], url[i], price[i], parentUrl, "", review[i], category, "Search", callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });

    return index;
}

function processWhenDone() {
	var search = GetParameterByName(location.href, "field-keywords");
	if(search.trim()=="" || $("#bcKwText").text() !== '"'+search+'"' || 
		$("#bcKwText").css("visibility")!= "visible"){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'search'});
        setTimeout("processWhenDone()", 500);
    }else {
        var Url = location.href;
        ParentUrl = Url;
        if (ParentUrl.indexOf("/s/") < 0) {
            return;
        }
        var _Pos = Url.lastIndexOf('/');
        ParentUrl = Url.replace(/\&page=[0-9]+/, "");
        ContentScript.sendMessage({type: "remove-settings", Url: "", ParentUrl: ParentUrl, IsFree: false});
        startPulling(1);
    }
}

function parseDataFromBookPageAndSend(num, url, price, parenturl, nextUrl, reviews, category, categoryKind, callback)
{
    callback = ValueOrDefault(callback, function(){});
    var parser = new BookPageParser(url);
    if(parser.isNotValid()) return callback();
    parser.GetBookData(url, price, reviews, function(pageData) {
        ContentScript.sendMessage({type: "get-settings"}, function (response) {
            // check if we still on the same search keywords page
            if (categoryKind == 'Search' && category != SearchKeyword) return;
            ContentScript.sendMessage({
                type: "save-settings",
                No: num,
                URL: url,
                ParentURL: parenturl,
                NextUrl: nextUrl,
                Title: pageData.title,
                Description: pageData.description,
                Price: pageData.price,
                EstSales: pageData.estSale,
                SalesRecv: pageData.salesRecv,
                Reviews: pageData.reviews,
                SalesRank: pageData.salesRank,
                Category: category,
                CategoryKind: categoryKind,
                PrintLength: pageData.printLength,
                Author: pageData.author,
                DateOfPublication: pageData.dateOfPublication,
                GoogleSearchUrl: pageData.googleSearchUrl,
                GoogleImageSearchUrl: pageData.googleImageSearchUrl,
                Rating: pageData.rating
            }, function(response){
                return callback();
            });

        });
    });
}

function LoadBestSellersPage(pageNumber){
    var pageUrl = ParentUrl + "?pg=" + pageNumber;
    if(isTop100Free())
        pageUrl += '&tf=1';
    $.get(pageUrl, function(responseText){
        ParseBestSellersPage(responseText, ParentUrl, false);
    });
}

var SearchResultsPager;
function LoadSearchResultsPage(callback){
    var itemsPerPage = SiteParser.SearchResultsNumber;
    var search = GetParameterByName(location.href, "field-keywords");
    SearchKeyword = search;

    if(SearchResultsPager === undefined) {
        SearchResultsPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, ParentUrl){
            return ParseSearchPage(startFromIndex, maxResults, responseText, ParentUrl, search);
        }, function(url, page){
            return url + '&page=' + page;
        });
    }

    setTimeout(SearchResultsPager.loadNextPage.bind(SearchResultsPager, callback), 1000);
}

var AuthorPager;
function LoadAuthorResultPage(callback){
    var itemsPerPage = SiteParser.AuthorResultsNumber;

    if(AuthorPager === undefined) {
        AuthorPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, ParentUrl){
            return ParseAuthorPage(startFromIndex, maxResults, responseText, ParentUrl);
        }, function(url, page){
            return url + '?page=' + page;
        });
    }

    AuthorPager.loadNextPage(callback);
}

var PagesPulled = 0;
function startPulling(pageNumber){
    if (pageNumber <= PagesPulled) return;
    PagesPulled = pageNumber;
    ContentScript.sendMessage({type:"set-IsPulling", IsPulling: true});

    if(IsAuthorPage()){
        LoadAuthorResultPage();
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'author'});
    }
    else if (IsBestSellersPage(location.href)){
        LoadBestSellersPage(pageNumber);
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'best-seller'});
    }
    else if(IsSearchPage(location.href)){
        LoadSearchResultsPage();
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'search'});
    }
    else if (IsSingleBookPage(location.href)){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'single'});
    }
}
