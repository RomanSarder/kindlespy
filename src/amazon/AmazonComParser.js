/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonComParser(){
    this.MainUrl = "http://www.amazon." + AmazonComParser.Zone;
    this.CompletionUrl = "http://completion.amazon." + AmazonComParser.Zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=1";
    this.Region = AmazonComParser.Region;
    this.ParamUrlBestSellers = "341689031";
    this.AreYouAnAuthorPattern = "Are You an Author";
    this.Free = 'Free';
    this.CurrencySign = "$";
    this.CurrencySignForExport = "$";
    this.DecimalSeparator = ".";
    this.ThousandSeparator = ",";
    this.SearchResultsNumber = 16;
    this.AuthorResultsNumber = 12;
    this.Publisher = "Publisher";
    this.searchKeys = new Array("to buy","to rent");
    this.NumberSign = "#";
    this.SearchPattern = "Kindle Edition";
    this.EstSalesScale = [
        {"min": 1, "max": 5, "EstSale": 120000},
        {"min": 6, "max": 10, "EstSale": 105000},
        {"min": 11, "max": 20, "EstSale": 90000},
        {"min": 21, "max": 35, "EstSale": 75000},
        {"min": 36, "max": 100, "EstSale": 55000},
        {"min": 101, "max": 200, "EstSale": 30000},
        {"min": 201, "max": 350, "EstSale": 12000},
        {"min": 351, "max": 500, "EstSale": 6000},
        {"min": 501, "max": 750, "EstSale": 4500},
        {"min": 751, "max": 1500, "EstSale": 3300},
        {"min": 1501, "max": 3000, "EstSale": 2550},
        {"min": 3001, "max": 4000, "EstSale": 2100},
        {"min": 4001, "max": 5000, "EstSale": 1700},
        {"min": 5001, "max": 6000, "EstSale": 1500},
        {"min": 6001, "max": 7000, "EstSale": 1250},
        {"min": 7001, "max": 8000, "EstSale": 1000},
        {"min": 8001, "max": 9000, "EstSale": 750},
        {"min": 9001, "max": 10000, "EstSale": 600},
        {"min": 10001, "max": 12000, "EstSale": 430},
        {"min": 12001, "max": 15000, "EstSale": 350},
        {"min": 15001, "max": 17500, "EstSale": 310},
        {"min": 17501, "max": 20000, "EstSale": 285},
        {"min": 20001, "max": 25000, "EstSale": 245},
        {"min": 25001, "max": 30000, "EstSale": 200},
        {"min": 30001, "max": 35000, "EstSale": 140},
        {"min": 35001, "max": 50000, "EstSale": 110},
        {"min": 50001, "max": 65000, "EstSale": 50},
        {"min": 65001, "max": 80000, "EstSale": 25},
        {"min": 80001, "max": 100000, "EstSale": 15},
        {"min": 100001, "max": 200000, "EstSale": 4},
        {"min": 200001, "max": 500000, "EstSale": 2},
        {"min": 500001, "max": -1, "EstSale": 1}
    ];
}

AmazonComParser.Zone = "com";
AmazonComParser.Region = "USA";

AmazonComParser.prototype.GetTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (titleNodes === undefined || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonComParser.prototype.GetDescription = function(jqNodes){
    return jqNodes.find("#outer_postBodyPS").text().trim();
};

AmazonComParser.prototype.GetKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find(".tp").find("tr").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
    });

    return retval;
};

AmazonComParser.prototype.GetUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find(".tpType > a:first").attr("href");
};

AmazonComParser.prototype.GetPriceFromKindleEditionRow = function(kindleEditionRow) {
    var priceTag = kindleEditionRow.find(".toeOurPrice > a:first");
    if (priceTag.length > 0) return priceTag;
    return kindleEditionRow.find(".toeOurPriceWithRent > a:first");
};

AmazonComParser.prototype.GetReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".reviewsCount > a:first").text();
};

AmazonComParser.prototype.ParsePrice = function(price) {
    if(price == this.Free) return 0;
    if(!price) return 0;
    return price.substr(1);
};

AmazonComParser.prototype.FormatPrice = function(price) {
    return this.CurrencySign + price;
};

AmazonComParser.prototype.GetGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonComParser.prototype.GetImageUrlSrc = function(responseText) {
    return ParseString(responseText.find('#holderMainImage noscript').text(),"src=","\"", "\" ");
};

AmazonComParser.prototype.GetReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    return rl_reviews.length ? $(rl_reviews).text().trim() : "0";
};

AmazonComParser.prototype.GetRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if(ratingString === undefined && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonComParser.prototype.GetTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var result = totalSearchResult.substring(totalSearchResult.indexOf("of")+3, totalSearchResult.indexOf("results")-1).replace(/[^0-9]/g,'');
    return result;
};
