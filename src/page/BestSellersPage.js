/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function BestSellersPage(){
    if ( BestSellersPage.prototype._singletonInstance )
        return BestSellersPage.prototype._singletonInstance;
    BestSellersPage.prototype._singletonInstance = this;

    this.name = BestSellersPage.name;
}

BestSellersPage.name = 'best-seller';

BestSellersPage.prototype.loadData = function(pullingToken, siteParser, parentUrl, search, pageNumber, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    var _this = this;
    var pageUrl = parentUrl + "?pg=" + pageNumber;
    if(Helper.isTop100Free())
        pageUrl += '&tf=1';
    $.get(pageUrl, function(responseText){
        // no need jQuery here: // var jqResponseText = parseHtmlToJquery(responseText);
        _this.parsePage(pullingToken, responseText, parentUrl);
        return callback();
    });
};

BestSellersPage.prototype.parsePage = function(pullingToken, responseText, parentUrl){
    var pattern = 'class="zg_itemImmersion"';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var no = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var index = 0;
    var bIsExist = [];
    category = this.getCategoryInfo(str).trim();

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        no[index] = this.getNoInfo(str);
        url[index] = this.getPageUrl(str);
        price[index] = this.getPriceInfo(str);
        review[index] = this.getReviewInfo(str);

        pos = str.indexOf(pattern);
        index++;
    }

    url.forEach(function(item, i) {
        if(url[i] !== undefined){
            kindleSpy.parserAsyncRunner.start(function(callback){
                function wrapper(){
                    kindleSpy.parseDataFromBookPageAndSend(pullingToken, no[i], url[i], price[i], parentUrl, "", review[i], category, "Seller", callback);
                }
                setTimeout(wrapper, i*1000);
            })
        }
    });
};

BestSellersPage.prototype.getCategoryInfo = function(responseText){
    return Helper.parseString(responseText, 'class="category"', '>', '<');
};

BestSellersPage.prototype.getNoInfo = function(responseText){
    return Helper.parseString(responseText, 'class="zg_rankNumber"', ">", ".");
};

BestSellersPage.prototype.getPriceInfo = function(responseText){
    return Helper.parseString(responseText,'class="price"', ">", "<");
};

BestSellersPage.prototype.getPageUrl = function(responsneText){
    return Helper.parseString(responsneText, 'class="zg_title"', 'href="', '"');
};

BestSellersPage.prototype.getReviewInfo = function(responseText){
    var pattern = "a href";
    var str = responseText;
    var pos = str.indexOf(pattern);

    var review = "";

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        review = Helper.parseString(str, "product-reviews", '>', '<');
        if (typeof review !== "undefined" && review.length > 0) return review;

        pos = str.indexOf(pattern);
    }

    return "0";
};