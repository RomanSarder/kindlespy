/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function SearchResultsPage(){
    if ( SearchResultsPage.prototype._singletonInstance )
        return SearchResultsPage.prototype._singletonInstance;
    SearchResultsPage.prototype._singletonInstance = this;

    this.SearchResultsPager;
    this.SearchKeyword;
}

SearchResultsPage.prototype.LoadData = function(siteParser, parentUrl, search, callback){
    var _this = this;
    var itemsPerPage = siteParser.SearchResultsNumber;
    this.SearchKeyword = search;

    if(this.SearchResultsPager === undefined) {
        this.SearchResultsPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, parentUrl){
            var jqResponseText = $(responseText);
            return new SearchPageParser().ParsePage(startFromIndex, maxResults, jqResponseText, parentUrl, search, siteParser, "Search");
        }, function(url, page){
            return url + '&page=' + page;
        });
    }

    setTimeout(this.SearchResultsPager.loadNextPage.bind(this.SearchResultsPager, parentUrl, callback), 1000);
};