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
            return _this.ParsePage(startFromIndex, maxResults, responseText, parentUrl, siteParser);
        }, function(url, page){
            return url + '&page=' + page;
        });
    }
    setTimeout(this.AuthorSearchResultsPager.loadNextPage.bind(this.AuthorSearchResultsPager, parentUrl, callback), 1000);
};

AuthorSearchResultsPage.prototype.ParsePage= function(startIndex, maxResults, responseText, parentUrl, siteParser)
{
    var _this = this;
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category = $(responseText).find("#s-result-count > span > span").text().trim();

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
            return $(this).text() == siteParser.SearchPattern || $(this).children("a:contains(" + siteParser.SearchPattern+ ")").length > 0;
        }).parent();
        price[index] = siteParser.CurrencySign + "0" + siteParser.DecimalSeparator + "00";
        if($(kprice).length > 0)
            var prices = kprice.find('span.s-price');
        var el_price;
        if (prices != undefined) {
            if ((prices.parent().parent().has('span.s-icon-kindle-unlimited').length > 0)
                || (prices.parent().has("span:contains('" + siteParser.searchKeys[1] + "')").length > 0)) {
                el_price = $.grep(kprice.find('span.s-price'), function (element) {
                    return ($(element).parent().has("span:contains('" + siteParser.searchKeys[0] + "')").length > 0);
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

    if (typeof category === undefined)
    {
        category = ParseString(responseText, 'entityHeader', '>', '<');
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }
    var totalResults = parseInt(siteParser.GetTotalSearchResult(responseText).replace(/,/g,''));
    ContentScript.sendMessage({type:"save-TotalResults", TotalResults: totalResults});

    var purl = location.href.replace(/\&page=[0-9]+/, '');
    if (parentUrl !== purl) return;

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