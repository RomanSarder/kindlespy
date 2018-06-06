/**
 * Created by Andrey Klochkov on 09.03.2015.
 * class AmazonFrParser
 */

function AmazonFrParser(){
    this.mainUrl = "//www.amazon." + AmazonFrParser.zone;
    // Amazon.fr uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=5&l=fr_FR";
    this.region = AmazonFrParser.region;
    this.areYouAnAuthorPattern = "Etes-vous un auteur";
    this.free = 'gratuit';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    // dynamic number, depends on old or new design
    // should be 20 or 50 items per page
    this.bestSellerResultsNumber = $('.zg_rankDiv').length || $('.zg-badge-text').length;
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editeur";
    this.searchKeys = [decodeURI(encodeURI("achat")),"louer"]; //à l'achat
    this.numberSign = decodeURI("n%C2%B0");
    this.searchPattern = "Format Kindle";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';
    this.estSalesPercentage = 9;
}

AmazonFrParser.zone = "fr";
AmazonFrParser.region = "FR";

AmazonFrParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonFrParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

AmazonFrParser.prototype.getKindleEditionRow = function(jqNode) {
    var _this = this;
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonFrParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonFrParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonFrParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonFrParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonFrParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonFrParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#imgBlkFront').length !== 0 ?
        responseText.find('#imgBlkFront').attr('data-a-dynamic-image') :
        responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonFrParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('commentaires','').replace('commentaire','').replace('client', '').trim() : "0";
};

AmazonFrParser.prototype.getRating = function(responseText){
    var pattern = decodeURI(encodeURI("étoiles sur"));
    var ratingString = responseText.find("#revSum span:contains('" + pattern + "')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split(pattern)[0].trim();
};

AmazonFrParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("sur") != -1 ? totalSearchResult.indexOf("sur") + 4 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf(decodeURI(encodeURI("résultats"))) - 1);
};

AmazonFrParser.prototype.getPrintLength = function(jqNodes) {
    var printLengthNodes = jqNodes.find('#productDetailsTable .content li:contains(Nombre de pages)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes !== 'undefined' && printLengthNodes.length > 0) return parseInt(printLengthNodes[0].nodeValue).toString();

    printLengthNodes = jqNodes.find('#aboutEbooksSection span a:first').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes !== 'undefined' && printLengthNodes.length > 0) return parseInt(printLengthNodes[0].nodeValue).toString();

    return null;
};
