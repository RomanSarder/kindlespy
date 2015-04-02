/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function AuthorSearchResultsPage(){
    if ( AuthorSearchResultsPage.prototype._singletonInstance )
        return AuthorSearchResultsPage.prototype._singletonInstance;
    AuthorSearchResultsPage.prototype._singletonInstance = this;

    this.AuthorSearchResultsPager;
}

AuthorSearchResultsPage.prototype.LoadData = function(siteParser, parentUrl, callback){
    var _this = this;
    var itemsPerPage = siteParser.AuthorResultsNumber;
    if(_this.AuthorSearchResultsPager === undefined) {
        _this.AuthorSearchResultsPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, parentUrl){
            var jqResponseText = $(responseText);
            var category = jqResponseText.find("#s-result-count > span > span").text().trim().replace(/"/g,'');
            return new SearchPageParser().ParsePage(startFromIndex, maxResults, jqResponseText, parentUrl, category, siteParser, "Author");
        }, function(url, page){
            return url + '&page=' + page;
        });
    }
    setTimeout(this.AuthorSearchResultsPager.loadNextPage.bind(this.AuthorSearchResultsPager, parentUrl, callback), 1000);
};