/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function AuthorPage(){
    if ( AuthorPage.prototype._singletonInstance )
        return AuthorPage.prototype._singletonInstance;
    AuthorPage.prototype._singletonInstance = this;

    this.AuthorPager;
}

AuthorPage.prototype.LoadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = ValueOrDefault(callback, function(){});
    var _this = this;
    var itemsPerPage = siteParser.AuthorResultsNumber;
    if(this.AuthorPager === undefined) {
        this.AuthorPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, parentUrl){
            var jqResponseText = parseHtmlToJquery(responseText);
            return _this.ParsePage(pullingToken, startFromIndex, maxResults, jqResponseText, parentUrl, siteParser);
        }, function(url, page){
            return url + '?page=' + page;
        });
    }

    this.AuthorPager.loadNextPage(parentUrl, callback);
};

AuthorPage.prototype.ParsePage = function(pullingToken, startIndex, maxResults, jqNodes, parentUrl, siteParser){
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var counter = 0;
    var index = 0;

    var jqResponse =
    jqNodes.find(".results").children().each(function() {
        if(this.id == "result_"+(startIndex+counter)) {
            if(counter>=maxResults) return;
            var krow = siteParser.getKindleEditionRow($(this));
            No[index] = parseInt(index) + 1 + parseInt(startIndex);
            if(typeof krow == "undefined"){
                counter++;
                return;
            }

            url[index] = siteParser.getUrlFromKindleEditionRow(krow);
            review[index] = siteParser.getReviewsCountFromResult($(this));
            if(!review[index]) review[index] = "0";
            var kprice = siteParser.getPriceFromKindleEditionRow(krow);
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

    //category = this.GetAuthorCategory(jqNodes).trim();

    //if (typeof category === "undefined" || category.length < 1)
    //{
        category = jqNodes.find("#entityHeader").text().trim();
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    //}

    url.forEach(function(item, i) {
        if (url[i] !== undefined && url[i].length > 0
            && price[i] !== undefined && price[i].length > 0){
            ParserAsyncRunner.start(function(callback){
                function wrapper(){
                    parseDataFromBookPageAndSend(pullingToken, No[i], url[i], price[i], parentUrl, "", review[i], category, "Author", callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });

    return index;
};

AuthorPage.prototype.GetAuthorCategory = function(responseText){
    return ParseString(responseText, 'EntityName', '<b>', '</b>');
};