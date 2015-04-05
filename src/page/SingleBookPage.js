/**
 * Created by Andrey Klochkov on 04.05.15.
 */

function SingleBookPage(){
    if ( AuthorSearchResultsPage.prototype._singletonInstance )
        return AuthorSearchResultsPage.prototype._singletonInstance;
    AuthorSearchResultsPage.prototype._singletonInstance = this;
}

SingleBookPage.prototype.LoadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = ValueOrDefault(callback, function(){});
    return callback();
};