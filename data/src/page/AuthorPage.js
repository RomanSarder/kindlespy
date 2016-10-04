/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function AuthorPage(){
    if ( AuthorPage.prototype._singletonInstance )
        return AuthorPage.prototype._singletonInstance;
    AuthorPage.prototype._singletonInstance = this;

    this.name = AuthorPage.name;
    this.authorPager = undefined;
}

AuthorPage.name = 'author';

AuthorPage.prototype.loadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    var itemsPerPage = siteParser.authorResultsNumber;
    if (typeof this.authorPager === 'undefined') {
        this.authorPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, parentUrl){
            var jqResponseText = Helper.parseHtmlToJquery(responseText);
            return _this.parsePage(pullingToken, startFromIndex, maxResults, jqResponseText, parentUrl, siteParser);
        }, function(url, page){
            return url + '?page=' + page;
        });
    }

    this.authorPager.loadNextPage(parentUrl, callback);
};

AuthorPage.prototype.parsePage = function(pullingToken, startIndex, maxResults, jqNodes, parentUrl, siteParser){
    var no = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var counter = 0;
    var index = 0;
    var result;

    var listItems = jqNodes.find("#mainResults li").has('.s-item-container');

    listItems.each(function() {
        if($(this).attr('id') !== 'result_'+(startIndex+index)
            && $(this).attr('id') !== 'centerPlus') return;
        result = $(this).find('.s-item-container');
        if(counter>=maxResults) return;
        no[index] = startIndex + index + 1;
        url[index] = $(result).find('a:contains("' + siteParser.searchPattern + '")').attr("href");
        if(!url[index]) {
            index++;
            return;
        }
        var kprice = $(result).find('div').filter(function () {
            return $(this).text() == siteParser.searchPattern || $(this).children("a:contains(" + siteParser.searchPattern+ ")").length > 0;
        });
        price[index] = siteParser.currencySign + "0" + siteParser.decimalSeparator + "00";
        if($(kprice).length > 0) {
            var prices = kprice.next().find('span.s-price');
        }
        var el_price;
        if (typeof prices !== 'undefined') {
            if ((prices.parent().parent().has('span.s-icon-kindle-unlimited').length > 0)
                || (prices.parent().has("span:contains('" + siteParser.searchKeys[1] + "')").length > 0)) {
                el_price = $.grep(prices, function (element) {
                    return ($(element).parent().has("span:contains('" + siteParser.searchKeys[0] + "')").length > 0);
                });
            }else if(prices.parent().parent().parent().has("h3:contains('Audible Audio Edition')").length > 0){ //Amazon Added Audible Audio Edition block
                el_price = $(prices[0]);
            }else if($(prices).length > 1){
                el_price = $(prices[0]);
            }else if(kprice.find('span.s-price').length > 0) {
                el_price = kprice.find('span.s-price');
            }else{
                el_price =  prices;
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

    category = jqNodes.find("#entityHeader").text().trim();
    var tmpSplit =category.split("by");
    if (tmpSplit.length > 1) category = tmpSplit[1];
    else category = jqNodes.find("#ap-author-name").text().trim();

    url.forEach(function(item, i) {
        if (typeof url[i] !== 'undefined' && url[i].length > 0
            && typeof price[i] !== 'undefined' && price[i].length > 0){
            kindleSpy.parserAsyncRunner.start(function(callback){
                function wrapper(){
                    kindleSpy.parseDataFromBookPageAndSend(pullingToken, no[i], url[i], price[i], parentUrl, "", review[i], category, "Author", callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });

    return counter;
};

AuthorPage.prototype.getAuthorCategory = function(responseText){
    return Helper.parseString(responseText, 'EntityName', '<b>', '</b>');
};