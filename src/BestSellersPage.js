/**
 * Created by Andrey Klochkov on 31.03.15.
 */
function BestSellersPage(){
    if ( BestSellersPage.prototype._singletonInstance )
        return BestSellersPage.prototype._singletonInstance;
    BestSellersPage.prototype._singletonInstance = this;
}
BestSellersPage.prototype.LoadData = function(pageNumber, parentUrl){
    var _this = this;
    var pageUrl = parentUrl + "?pg=" + pageNumber;
    if(isTop100Free())
        pageUrl += '&tf=1';
    $.get(pageUrl, function(responseText){
        _this.ParsePage(responseText, ParentUrl);
    });
};

BestSellersPage.prototype.ParsePage = function(responseText, parentUrl){
    var pattern = 'class="zg_itemImmersion"';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var index = 0;
    var bIsExist = [];
    category = this.GetCategoryInfo(str).trim();

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        No[index] = this.GetNoInfo(str);
        url[index] = this.GetPageUrl(str);
        price[index] = this.GetPriceInfo(str);
        review[index] = this.GetReviewrInfo(str);

        pos = str.indexOf(pattern);
        index++;
    }

    ContentScript.sendMessage({type:"get-settings"}, function(response){
        url.forEach(function(item, i) {
            if(url[i] !== undefined){
                AsyncRunner.start(function(callback){
                    function wrapper(){
                        parseDataFromBookPageAndSend(No[i], url[i], price[i], parentUrl, "", review[i], category, "Seller", callback);
                    }
                    setTimeout(wrapper, i*1000);
                })
            }
        });
    });
};

BestSellersPage.prototype.GetCategoryInfo = function(responseText){
    return ParseString(responseText, 'class="category"', '>', '<');
};

BestSellersPage.prototype.GetNoInfo = function(responseText){
    return ParseString(responseText, 'class="zg_rankNumber"', ">", ".");
};

BestSellersPage.prototype.GetPriceInfo = function(responseText){
    return ParseString(responseText,'class="price"', ">", "<");
};

BestSellersPage.prototype.GetPageUrl = function(responsneText){
    return ParseString(responsneText, 'class="zg_title"', 'href="', '"');
};

BestSellersPage.prototype.GetReviewrInfo = function(responseText){
    var pattern = "a href";
    var str = responseText;
    var pos = str.indexOf(pattern);

    var review = "";

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        review = ParseString(str, "product-reviews", '>', '<');
        if (typeof review !== "undefined" && review.length > 0) return review;

        pos = str.indexOf(pattern);
    }

    return "0";
};