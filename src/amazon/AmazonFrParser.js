/**
 * Created by Andrey Klochkov on 09.03.2015.
 * class AmazonFrParser
 */

function AmazonFrParser(){
    this.MainUrl = "http://www.amazon." + AmazonFrParser.Zone;
    // Amazon.fr uses api from amazon.co.uk
    this.CompletionUrl = "http://t1-completion.amazon." + AmazonCoUkParser.Zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=5";
    this.Region = AmazonFrParser.Region;
    this.ParamUrlBestSellers = "695398031";
    this.AreYouAnAuthorPattern = "Etes-vous un auteur";
    this.Free = 'Gratuit';
    this.CurrencySign = "&euro;";
    this.CurrencySignForExport = "\u20AC";
    this.ThousandSeparator = ".";
    this.DecimalSeparator = ",";
    this.SearchResultsNumber = 16;
    this.AuthorResultsNumber = 16;
    this.Publisher = "Editeur";
    this.searchKeys = new Array("à acheter","louer");
    this.NumberSign = decodeURI("n%C2%B0");
    this.SearchPattern = "Format Kindle";
    this.EstSalesScale = [
        {"min": 1, "max": 5, "EstSale": 32800},
        {"min": 6, "max": 10, "EstSale": 28700},
        {"min": 11, "max": 20, "EstSale": 24600},
        {"min": 21, "max": 35, "EstSale": 20500},
        {"min": 36, "max": 100, "EstSale": 15033},
        {"min": 101, "max": 200, "EstSale": 8200},
        {"min": 201, "max": 350, "EstSale": 3280},
        {"min": 351, "max": 500, "EstSale": 1640},
        {"min": 501, "max": 750, "EstSale": 1230},
        {"min": 751, "max": 1500, "EstSale": 902},
        {"min": 1501, "max": 3000, "EstSale": 697},
        {"min": 3001, "max": 4000, "EstSale": 574},
        {"min": 4001, "max": 5000, "EstSale": 465},
        {"min": 5001, "max": 6000, "EstSale": 410},
        {"min": 6001, "max": 7000, "EstSale": 342},
        {"min": 7001, "max": 8000, "EstSale": 273},
        {"min": 8001, "max": 9000, "EstSale": 205},
        {"min": 9001, "max": 10000, "EstSale": 164},
        {"min": 10001, "max": 12000, "EstSale": 117},
        {"min": 12001, "max": 15000, "EstSale": 96},
        {"min": 15001, "max": 17500, "EstSale": 85},
        {"min": 17501, "max": 20000, "EstSale": 78},
        {"min": 20001, "max": 25000, "EstSale": 67},
        {"min": 25001, "max": 30000, "EstSale": 55},
        {"min": 30001, "max": 35000, "EstSale": 39},
        {"min": 35001, "max": 50000, "EstSale": 30},
        {"min": 50001, "max": 65000, "EstSale": 14},
        {"min": 65001, "max": 80000, "EstSale": 21},
        {"min": 80001, "max": 100000, "EstSale": 7},
        {"min": 100001, "max": 200000, "EstSale": 1},
        {"min": 200001, "max": 500000, "EstSale": 1},
        {"min": 500001, "max": -1, "EstSale": 1}
    ];
}

AmazonFrParser.Zone = "fr";
AmazonFrParser.Region = "FR";

AmazonFrParser.prototype.GetTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (titleNodes === undefined || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};
AmazonFrParser.prototype.GetDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};
AmazonFrParser.prototype.GetKindleEditionRow = function(jqNode) {
    var _this = this;
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf(_this.SearchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonFrParser.prototype.GetUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonFrParser.prototype.GetPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonFrParser.prototype.GetReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonFrParser.prototype.ParsePrice = function(price) {
    if(price == this.Free) return 0;
    if(!price) return 0;
    return price.replace(/\./g,'').replace(',', '.').replace(/[^0-9\.]/g, '');
};

AmazonFrParser.prototype.FormatPrice = function(price) {
    return this.CurrencySign + price;
};

AmazonFrParser.prototype.GetGoogleImageSearchUrlRel = function(responseText, url, callback) {
    callback(responseText.find('#main-image').attr('rel'));
};

AmazonFrParser.prototype.GetImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonFrParser.prototype.GetReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('commentaires','').replace('commentaire','').trim();
    else
        return "0";
};

AmazonFrParser.prototype.GetRating = function(responseText){
    var ratingString = responseText.find("#revSum span:contains('étoiles sur')");
    if(ratingString === undefined && ratingString =='') return undefined;
    return ratingString.text().split("étoiles sur")[0].trim();
};

AmazonFrParser.prototype.GetTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var result = totalSearchResult.substring(totalSearchResult.indexOf("sur")+4, totalSearchResult.indexOf("résultats")-1).replace(/[^0-9]/g,'');
    return result;
};
