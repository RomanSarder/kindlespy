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
    $("#nav-searchbar, .nav-searchbar").submit(function()
    {
        SearchKeyword = '';
        ContentScript.sendMessage({type: "remove-settings", ParentUrl: ParentUrl}, function(){
            var searchResultPager = new SearchResultsPage();
            if (searchResultPager.SearchResultsPager) searchResultPager.SearchResultsPager.stop();
            searchResultPager.SearchResultsPager = undefined;
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

var PagesPulled = 0;
function startPulling(pageNumber){
    if (pageNumber <= PagesPulled) return;
    PagesPulled = pageNumber;
    ContentScript.sendMessage({type:"set-IsPulling", IsPulling: true});

    if(IsAuthorPage()){
        new AuthorPage().LoadData(SiteParser, ParentUrl);
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'author'});
    }
    else if(IsAuthorSearchResultPage(location.href)){
        new AuthorSearchResultsPage().LoadData(SiteParser, ParentUrl)
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'author-search'});
    }
    else if (IsBestSellersPage(location.href)){
        new BestSellersPage().LoadData(pageNumber, ParentUrl);
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'best-seller'});
    }
    else if(IsSearchPage(location.href)){
        SearchKeyword = GetParameterByName(location.href, "field-keywords");
        new SearchResultsPage().LoadData(SiteParser, ParentUrl, SearchKeyword);
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'search'});
    }
    else if (IsSingleBookPage(location.href)){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'single'});
    }
}
