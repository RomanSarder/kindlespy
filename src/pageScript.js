/**
 * Created by Andrey Klochkov on 10.04.2015.
 */

function KindleSpy(){
    var _this = this;
    _this.pageData = new DataStorage();
    _this.url = '';
    _this.parentUrl = ''; // trimmed Url
    _this.siteParser = undefined;
    _this.bookStorage = undefined;
    // used to invalidate the current data is being pulled when the other pulling with new parameters started
    _this.pullingToken = 0;
    _this.currentPage = undefined;
    _this.pagesPulled = 0;

    _this.parserAsyncRunner = new AsyncRunner();
    _this.parserAsyncRunner.itemFinished = function(){
        _this.pageData.get().isWaitingForPulling = false;
    };
    _this.parserAsyncRunner.finished = function(){
        _this.pageData.get().isPulling = false;
    };

}

KindleSpy.prototype.start = function(){
    var _this = this;
    _this.url = location.href;
    _this.parentUrl = trimCurrentUrl(_this.url);
    _this.siteParser = GetSiteParser(_this.url);
    _this.bookStorage = new BookStorage();
    _this.bookStorage.trackData();
    setInterval('kindleSpy.bookStorage.trackData()', 2*60*60*1000);

    if (_this.siteParser === undefined) return;
    if (_this.url.indexOf(this.siteParser.mainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0) return;
    _this.currentPage = this.getPageFromCurrentPage();
    if (_this.currentPage === undefined) return;

    // Amazon search form
    $("#nav-searchbar, .nav-searchbar").submit(function()
    {
        _this.clearSearchResults();
        setTimeout('kindleSpy.waitingForSearchResults()', 500);
    });

    _this.pullingToken = new Date().getTime();
    _this.startPulling(1);
};

KindleSpy.prototype.saveBook = function(book)
{
    var data = this.pageData.get();

    for (var i = 0; i < data.books.length; i++)
    {
        if (data.books[i].Title === book.Title && data.books[i].CategoryKind === book.CategoryKind)
        {
            data.books[i] = book;
            return;
        }
    }

    data.books.push(book);
};

KindleSpy.prototype.saveTotalResults = function(value){
    this.pageData.get().totalResults = value;
};

KindleSpy.prototype.getPageFromCurrentPage = function(){
    if(IsAuthorPage(document.documentElement.innerHTML, this.siteParser)){
        return new AuthorPage();
    }
    if(IsAuthorSearchResultPage(location.href, this.siteParser)){
        return new AuthorSearchResultsPage();
    }
    if (IsBestSellersPage(location.href, this.siteParser)){
        return new BestSellersPage();
    }
    if(IsSearchPage(location.href, this.siteParser)){
        return new SearchResultsPage();
    }
    if (IsSingleBookPage(location.href, this.siteParser)){
        return new SingleBookPage();
    }
};

KindleSpy.prototype.clearSearchResults = function(){
    this.pullingToken = 0;
    this.pageData.remove();
    var searchResultPage = new SearchResultsPage();
    if (searchResultPage.SearchResultsPager) searchResultPage.SearchResultsPager.stop();
    searchResultPage.SearchResultsPager = undefined;
    this.pagesPulled = 0;
};

KindleSpy.prototype.waitingForSearchResults = function(){
	var search = GetParameterByName(location.href, "field-keywords");
	if (search.trim() == ""
        || $("#bcKwText").text() !== '"'+search+'"'
        || $("#bcKwText").css("visibility") != "visible")
    {
        return setTimeout('kindleSpy.waitingForSearchResults()', 500);
    }

    this.startPullingSearchPage(location.href);
};

KindleSpy.prototype.parseDataFromBookPageAndSend = function(pullingToken, num, url, price, parentUrl, nextUrl, reviews, category, categoryKind, callback){
    callback = ValueOrDefault(callback, function(){});
    var _this = this;
    if (pullingToken != _this.pullingToken) return;
    var parser = new BookPageParser(null, _this.siteParser);
    if (parser.isNotValid()) return callback();
    parser.GetBookData(url, price, reviews, function(pageData) {
        // check if we still on the same search keywords page and didn't start a new pulling with new params
        if (pullingToken != _this.pullingToken) return;
        _this.saveBook({
            No: num,
            URL: url,
            ParentURL: parentUrl,
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
};

KindleSpy.prototype.startPulling = function(pageNumber){
    if (pageNumber <= this.pagesPulled) return;
    this.pagesPulled = pageNumber;
    var searchKeyword = GetParameterByName(this.url, "field-keywords");
    var data = this.pageData.get();
    data.isWaitingForPulling = true;
    data.isPulling = true;

    this.currentPage.LoadData(this.pullingToken, this.siteParser, this.parentUrl, searchKeyword, pageNumber);
};

KindleSpy.prototype.startPullingSearchPage = function(url){
    this.url = url;
    this.parentUrl = trimCurrentUrl(this.url);
    this.currentPage = new SearchResultsPage();
    this.pullingToken = new Date().getTime();
    this.startPulling(1);
};

// entry point
var kindleSpy = new KindleSpy();
$(window).ready(function () {
    kindleSpy.start();
});

// messages
Api.addListener(onMessageReceived);

function onMessageReceived(request, callback){
    callback = ValueOrDefault(callback, function(){});

    if(request.type === 'pull-data')
        return callback(kindleSpy.startPulling(request.page));

    if (request.type === "start-analyze-search-keywords") {
        kindleSpy.clearSearchResults();
        kindleSpy.startPullingSearchPage(getSearchUrl(request.keyword, kindleSpy.siteParser));
        return callback();
    }

    if (request.type === "get-data") {
        return callback(kindleSpy.pageData.get());
    }

    if (request.type === "save-pageNum") {
        kindleSpy.pageData.get().pageNum[request.tab] = request.pageNum;
        return callback();
    }

    if (request.type === "get-pageNum") {
        return callback(kindleSpy.pageData.get().pageNum[request.tab]);
    }

    if (request.type === "get-current-url") {
        return callback(location.href);
    }

    if (request.type === "get-type-page") {
        return callback(kindleSpy.currentPage.name);
    }

    if (request.type === "get-totalResults") {
        return callback(kindleSpy.pageData.get().totalResults);
    }
}