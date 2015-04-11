/**
 * Created by Jang on 4/28/14.
 */


var defaultSetting = {
    "version": "0.0.0",
    "IsWaitForPulling" : false,
    "IsPulling" : false,
    "CurrentUrl" : "",
    "PageNum" : {MainTab: "1", KeywordAnalysisTab: "1"},
    "MainUrl": "http://www.amazon.com/",
    "ParamUrlBestSellers" : "154606011",
    "TYPE" : "", // can be 'single' or empty
    "TotalResults":"",
    "Book":
        [
            //{"No": "", "Url":"", "ParentUrl":"", "NextUrl": "", "Title":"", "Description":"", "Price": "", "EstSales": "", "SalesRecv": "", "Reviews": "", "SalesRank": "", "Category": "", "CategoryKind":"Seller", "PrintLength":"", "Author":"", "DateOfPublication":"", "GoogleSearchUrl":"", "GoogleImageSearchUrl":"", "Rating":"",
            // PullingToken: ''}
        ]
};

var customStorage={};
function getStorage(){
    return customStorage;
}

function getSettings()
{
    var a = getStorage().settings;
    return a = a ? JSON.parse(a) : defaultSetting
}

function setSettings(value){
    getStorage().settings = JSON.stringify(value);
}

function RemoveSettings(url, parentUrl, IsFree)
{
    var setting = getSettings();

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
    setSettings(setting);
}

function SaveSettings(num, url, parentUrl, nextUrl, title, description, price, estsales, salesRecv, Reviews, salesRank, category, categoryKind, printLength, author, dateOfPublication, googleSearchUrl, googleImageSearchUrl, rating)
{
    var setting = getSettings();

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

    setSettings(setting);
}

function SavePageNum(pageNum, tabName)
{
    var setting = getSettings();
    setting.PageNum[tabName] = pageNum;
    setSettings(setting);
}
function SaveUrlParams(url, urlParamBestSellers)
{
    var setting = getSettings();
    setting.MainUrl = url;
    setting.ParamUrlBestSellers = urlParamBestSellers;
    setSettings(setting);
}

function SaveTotalResults(totalResults)
{
    var setting = getSettings();
    setting.TotalResults = totalResults;
    setSettings(setting);
}

var CurrentTabUrl;
var CurrentTabID;

chrome.runtime.onMessage.addListener(onMessageReceived);

function onMessageReceived(request, sender, callback){
    callback = ValueOrDefault(callback, function(){});
    if(request.page !== undefined)
        return callback(startPulling(request.page));

    if ("start-analyze-search-keywords" === request.type)
    {
        return callback(startPullingSearchPage(request.keyword));
    }

    if ("remove-settings" === request.type)
    {
        RemoveSettings(request.Url, request.ParentUrl, request.IsFree);
        return callback({});
    }

    if ("get-settings" === request.type)
    {
        return callback({
            settings: getSettings()
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
        var setting = getSettings();
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
        var setting = getSettings();
        setting.TYPE = request.TYPE;
        setSettings(setting);
        return callback({});
    }

    if ("get-type-page" === request.type)
    {
        var setting = getSettings();
        return callback({TYPE:setting.TYPE});
    }

    if ("save-TotalResults" === request.type)
    {
        SaveTotalResults(request.TotalResults);
        return callback({});
    }

    if ("get-TotalResults" === request.type)
    {
        var setting = getSettings();
        return callback({TotalResults:setting.TotalResults});
    }
}

chrome.runtime.sendMessage({action:'getVersion'}, function (version){
    var currentVersion = version;
    var savedVersion = getSettings().version;

    if (typeof savedVersion === "undefined" || currentVersion !== savedVersion)
    {
        defaultSetting.version = currentVersion;
        setSettings(defaultSetting);
    }
});


//______________________________________________________________________________________________________________________
var Url;
var ParentUrl; // trimmed Url
var SiteParser;
var BookStore;
// used to invalidate the current data is being pulled when the other pulling with new parameters started
var PullingToken = 0;
var CurrentPage;
var ParserAsyncRunner = new AsyncRunner();
ParserAsyncRunner.itemFinished = function(){
    var settings = getSettings();
    settings.IsWaitForPulling = false;
    setSettings(settings);
};
ParserAsyncRunner.finished = function(){
    var settings = getSettings();
    settings.IsPulling = false;
    setSettings(settings);
};

$(window).ready(function () {
    Url = location.href;
    ParentUrl = trimCurrentUrl(Url);
    SiteParser = GetSiteParser(Url);
    BookStore = new BookStorage();
    BookStore.TrackData();
    setInterval("BookStore.TrackData()", 2*60*60*1000);

    if (SiteParser === undefined) return;
    if (Url.indexOf(SiteParser.MainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0) return;
    CurrentPage = getPageFromCurrentPage();
    if (CurrentPage === undefined) return;

    // Amazon search form
    $("#nav-searchbar, .nav-searchbar").submit(function()
    {
        ClearSearchResults(function(){
            setTimeout("processWhenDone()", 500);
        });
    });

    PullingToken = new Date().getTime();
    startPulling(1);
});

function getPageFromCurrentPage(){
    if(IsAuthorPage()){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'author'});
        return new AuthorPage();
    }
    if(IsAuthorSearchResultPage(location.href)){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'author-search'});
        return new AuthorSearchResultsPage();
    }
    if (IsBestSellersPage(location.href)){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'best-seller'});
        return new BestSellersPage();
    }
    if(IsSearchPage(location.href)){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'search'});
        return new SearchResultsPage();
    }
    if (IsSingleBookPage(location.href)){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'single'});
        return new SingleBookPage();
    }
}

function ClearSearchResults(callback){
    callback = ValueOrDefault(callback, function(){});
    PullingToken = 0;
    ContentScript.sendMessage({type: "remove-settings", ParentUrl: ParentUrl}, function(){
        var searchResultPage = new SearchResultsPage();
        if (searchResultPage.SearchResultsPager) searchResultPage.SearchResultsPager.stop();
        searchResultPage.SearchResultsPager = undefined;
        PagesPulled = 0;
        callback();
    });
}

function ContentScript(){
}

ContentScript.sendMessage = function(message, callback){
    return onMessageReceived(message, null, callback);
};

function processWhenDone() {
	var search = GetParameterByName(location.href, "field-keywords");
	if(search.trim()=="" || $("#bcKwText").text() !== '"'+search+'"' || 
		$("#bcKwText").css("visibility")!= "visible"){
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'search'});
        setTimeout("processWhenDone()", 500);
    }else {
        Url = location.href;
        ParentUrl = Url;
        if (ParentUrl.indexOf("/s/") < 0) {
            return;
        }
        var _Pos = Url.lastIndexOf('/');
        ParentUrl = Url.replace(/\&page=[0-9]+/, "");
        ContentScript.sendMessage({type: "remove-settings", Url: "", ParentUrl: ParentUrl, IsFree: false});
        PullingToken = new Date().getTime();
        startPulling(1);
    }
}

function parseDataFromBookPageAndSend(pullingToken, num, url, price, parenturl, nextUrl, reviews, category, categoryKind, callback)
{
    callback = ValueOrDefault(callback, function(){});
    if (pullingToken != PullingToken) return;
    var parser = new BookPageParser(null, SiteParser);
    if(parser.isNotValid()) return callback();
    parser.GetBookData(url, price, reviews, function(pageData) {
        ContentScript.sendMessage({type: "get-settings"}, function (response) {
            // check if we still on the same search keywords page and didn't start a new pulling with new params
            if (pullingToken != PullingToken) return;
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
    var searchKeyword = GetParameterByName(Url, "field-keywords");
    var settings = getSettings();
    settings.IsWaitForPulling = true;
    settings.IsPulling = true;
    setSettings(settings);

    CurrentPage.LoadData(PullingToken, SiteParser, ParentUrl, searchKeyword, pageNumber);
}

function startPullingSearchPage(keyword){
    ClearSearchResults(function(){
        PullingToken = new Date().getTime();
        Url = getSearchUrl(keyword);
        ParentUrl = trimCurrentUrl(Url);
        CurrentPage = new SearchResultsPage();
        ContentScript.sendMessage({type: "set-type-page", TYPE: 'search'});
        startPulling(1);
    });
}