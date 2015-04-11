/**
 * Created by Andrey Klochkov on 10.04.2015.
 */

var pageSettings = new Settings();

function saveBook(book)
{
    var settings = pageSettings.getSettings();

    for (var i = 0; i < settings.books.length; i++)
    {
        if (settings.books[i].Title === book.Title && settings.books[i].CategoryKind === book.CategoryKind)
        {
            settings.books[i] = book;
            return;
        }
    }

    settings.books.push(book);
}

function saveTotalResults(value){
    pageSettings.getSettings().totalResults = value;
}

chrome.runtime.onMessage.addListener(onMessageReceived);

function onMessageReceived(request, sender, callback){
    callback = ValueOrDefault(callback, function(){});
    //popup
    if(request.type === 'pull-data')
        return callback(startPulling(request.page));

    //popup
    if (request.type === "start-analyze-search-keywords") {
        clearSearchResults();
        startPullingSearchPage(getSearchUrl(request.keyword));
        return callback();
    }

    //popup
    if (request.type === "get-settings") {
        return callback(pageSettings.getSettings());
    }

    //popup
    if (request.type === "save-pageNum") {
        pageSettings.getSettings().pageNum[request.tab] = request.pageNum;
        return callback();
    }

    //popup
    if (request.type === "get-pageNum") {
        return callback(pageSettings.getSettings().pageNum[request.tab]);
    }

    //popup
    if (request.type === "get-current-url") {
        return callback(location.href);
    }

    //popup
    if (request.type === "get-type-page") {
        return callback(CurrentPage.name);
    }

    //popup
    if (request.type === "get-totalResults") {
        return callback(pageSettings.getSettings().totalResults);
    }
}

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
    pageSettings.getSettings().isWaitingForPulling = false;
};
ParserAsyncRunner.finished = function(){
    pageSettings.getSettings().isPulling = false;
};

$(window).ready(function () {
    Url = location.href;
    ParentUrl = trimCurrentUrl(Url);
    SiteParser = GetSiteParser(Url);
    BookStore = new BookStorage();
    BookStore.trackData();
    setInterval("BookStore.trackData()", 2*60*60*1000);

    if (SiteParser === undefined) return;
    if (Url.indexOf(SiteParser.mainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0) return;
    CurrentPage = getPageFromCurrentPage();
    if (CurrentPage === undefined) return;

    // Amazon search form
    $("#nav-searchbar, .nav-searchbar").submit(function()
    {
        clearSearchResults();
        setTimeout(processWhenDone, 500);
    });

    PullingToken = new Date().getTime();
    startPulling(1);
});

function getPageFromCurrentPage(){
    if(IsAuthorPage(document.documentElement.innerHTML, SiteParser)){
        return new AuthorPage();
    }
    if(IsAuthorSearchResultPage(location.href)){
        return new AuthorSearchResultsPage();
    }
    if (IsBestSellersPage(location.href)){
        return new BestSellersPage();
    }
    if(IsSearchPage(location.href)){
        return new SearchResultsPage();
    }
    if (IsSingleBookPage(location.href)){
        return new SingleBookPage();
    }
}

function clearSearchResults(){
    PullingToken = 0;
    pageSettings.removeSettings();
    var searchResultPage = new SearchResultsPage();
    if (searchResultPage.SearchResultsPager) searchResultPage.SearchResultsPager.stop();
    searchResultPage.SearchResultsPager = undefined;
    PagesPulled = 0;
}

function ContentScript(){
}

ContentScript.sendMessage = function(message, callback){
    return onMessageReceived(message, null, callback);
};

function processWhenDone() {
	var search = GetParameterByName(location.href, "field-keywords");
	if (search.trim() == ""
        || $("#bcKwText").text() !== '"'+search+'"'
        || $("#bcKwText").css("visibility") != "visible")
    {
        return setTimeout(processWhenDone, 500);
    }

    startPullingSearchPage(location.href);
}

function parseDataFromBookPageAndSend(pullingToken, num, url, price, parenturl, nextUrl, reviews, category, categoryKind, callback)
{
    callback = ValueOrDefault(callback, function(){});
    if (pullingToken != PullingToken) return;
    var parser = new BookPageParser(null, SiteParser);
    if (parser.isNotValid()) return callback();
    parser.GetBookData(url, price, reviews, function(pageData) {
        // check if we still on the same search keywords page and didn't start a new pulling with new params
        if (pullingToken != PullingToken) return;
        saveBook({
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
        });

        return callback();
    });
}

var PagesPulled = 0;
function startPulling(pageNumber){
    if (pageNumber <= PagesPulled) return;
    PagesPulled = pageNumber;
    var searchKeyword = GetParameterByName(Url, "field-keywords");
    var settings = pageSettings.getSettings();
    settings.isWaitingForPulling = true;
    settings.isPulling = true;

    CurrentPage.LoadData(PullingToken, SiteParser, ParentUrl, searchKeyword, pageNumber);
}

function startPullingSearchPage(url){
    Url = url;
    ParentUrl = trimCurrentUrl(Url);
    CurrentPage = new SearchResultsPage();
    PullingToken = new Date().getTime();
    startPulling(1);
}