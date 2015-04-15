/**
 * Created by Andrey Klochkov on 12.10.2014.
 */

function BookPageParser(url, siteParser){
    this._siteParser = siteParser ? siteParser : Helper.getSiteParser(url);
}

BookPageParser.prototype.isNotValid = function (){
    return this._siteParser === undefined;
};

BookPageParser.prototype.getDateOfPublication = function(jqNodes, callback) {
    var pubdate = jqNodes.find('#pubdate').val();
    if(pubdate === undefined){
        var publisherElement = jqNodes.find('#productDetailsTable div.content li:contains(' + this._siteParser.publisher + ')');
        var dateOfPublication = Helper.parseString(publisherElement.text(), '', '(', ')');

        return callback(dateOfPublication);
    }

    $.ajax({
        url: this._siteParser.mainUrl + "/gp/product/features/ebook-synopsis/formatDate.html",
        data: { datetime: pubdate },
        dataType: "json",
        success: function (responseJson) {
            var dateOfPublication = responseJson.value;
            if(dateOfPublication != null) return callback(dateOfPublication.toString());
        },
        error: function (){
            return callback();
        }
    });
};

BookPageParser.prototype.getAuthorTitle = function(jqNodes) {
    return jqNodes.find('#productTitle').text().trim();
};

BookPageParser.prototype.getGoogleSearchUrlByTitleAndAuthor = function(title, author){
    var baseUrl = "http://google.com/";
    var queryString = "";
    if((title !== undefined) && (title.length > 0))
        queryString += title;
    if((author !== undefined) && (author.length > 0))
        queryString += " " + author;
    queryString = encodeURIComponent(queryString).replace(/'/g, '%27');
    return baseUrl + "?q=" + queryString + "&oq=" + queryString + "#safe=off&q="+ queryString;
};

BookPageParser.prototype.getGoogleImageSearchUrl = function(jqNodes, url, callback){
    var googleUrl = "https://www.google.com/";
    if(jqNodes === undefined || jqNodes.length == 0) {
        return callback(googleUrl);
    }
    this._siteParser.getGoogleImageSearchUrlRel(jqNodes, url, function(rel){
        if (rel === undefined || rel.length<1)
            return callback(googleUrl);
        return callback(googleUrl + "searchbyimage?hl=en&image_url=" + rel);
    });
};

BookPageParser.prototype.getImageUrl = function(jqNodes){
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    var src = this._siteParser.getImageUrlSrc(jqNodes);
    if (src === undefined || src.length < 1) return '';
    return src;
};

BookPageParser.prototype.getTitle = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.getTitle(jqNodes);
};

BookPageParser.prototype.getDescription = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.getDescription(jqNodes);
};

BookPageParser.prototype.getRating = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.getRating(jqNodes);
};

BookPageParser.prototype.getReviews = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.getReviews(jqNodes);
};

BookPageParser.prototype.getPrice = function(jqNodes) {
    var priceBlock = jqNodes.find('#priceBlock b.priceLarge');
    if(priceBlock && priceBlock.text().trim() !== '') {
        if(priceBlock.text().trim() == "free") return this._siteParser.formatPrice("0" + this._siteParser.decimalSeparator + "00");
         return priceBlock.text().trim();
    }
    priceBlock = jqNodes.find('#kindle_meta_binding_winner .price');
    return priceBlock ? priceBlock.text().trim() : "";
};

BookPageParser.prototype.getSalesRank = function(jqNodes) {
    if (jqNodes === undefined || jqNodes.length == 0) return '0';

    // when page refreshed it can be undefined
    if (this._siteParser === undefined) return '0';
    var salesRankNodes = jqNodes.find("#SalesRank").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(salesRankNodes === undefined || salesRankNodes.length < 2) return '0';
    var salesRankString = salesRankNodes[1].nodeValue.trim();
    if(( salesRankString === undefined) || (salesRankString == "")) return '0';
    return salesRankString.substring(salesRankString.indexOf(this._siteParser.numberSign) + this._siteParser.numberSign.length, salesRankString.indexOf(' '));
};

BookPageParser.prototype.getEstSale = function(salesRank) {
    var data = this._siteParser.estSalesScale;
    if (typeof salesRank === "undefined") return 1;
    var sale = salesRank.toString().replace(this._siteParser.thousandSeparator, "");

    for (var i = 0; i < data.length; i++) {
        if (sale >= data[i].min && sale <= data[i].max) return data[i].estSale;
    }

    return "0";
};

BookPageParser.prototype.getSalesRecv = function(estsales, price) {
    if (typeof estsales === "undefined") return price;

    return estsales * price;
};

BookPageParser.prototype.getPrintLength = function(jqNodes) {
    return parseInt(jqNodes.find('#pageCountAvailable span').text()).toString();
};

BookPageParser.prototype.getAuthor = function(jqNodes) {
    var author = jqNodes.find('.contributorNameTrigger>a').text().trim();
    if (author == ''){
        var asin = jqNodes.find('.contributorNameTrigger').attr('asin');
        author = jqNodes.find('#contributorContainer' + asin + ' b:first').text().trim();
    }

    return author;
};

BookPageParser.prototype.getSalesRankFromUrl = function(url, callback) {
    var _this = this;

    $.get(url, function (responseText) {
        var jqResponse = Helper.parseHtmlToJquery(responseText);
        var salesRank = _this.getSalesRank(jqResponse);
        if (!salesRank) salesRank = "1";
        callback(salesRank);
    });
};

BookPageParser.prototype.getBookData = function(url, price, reviews, callback) {
    var _this = this;

    $.get(url, function (responseText) {
        var jqResponseText = Helper.parseHtmlToJquery(responseText);
        var entryTitle = _this.getTitle(jqResponseText);
        if (entryTitle == '') entryTitle = _this.getAuthorTitle(jqResponseText);
        if (entryTitle === undefined) return;
        var entryDescription = _this.getDescription(jqResponseText);
        if (!reviews) reviews = _this.getReviews(jqResponseText);
        if (!price) price = _this.getPrice(jqResponseText);

        var entrySalesRank = _this.getSalesRank(jqResponseText);
        var entryEstSale = _this.getEstSale(entrySalesRank);
        var realPrice = _this._siteParser.parsePrice(price);
        var entrySalesRecv = _this.getSalesRecv(entryEstSale, realPrice);
        var entryPrintLength = _this.getPrintLength(jqResponseText);
        var entryAuthor = _this.getAuthor(jqResponseText);
        var entryGoogleSearchUrl = _this.getGoogleSearchUrlByTitleAndAuthor(entryTitle, entryAuthor);
        var entryImageUrl = _this.getImageUrl(jqResponseText);
        var entryRating = _this.getRating(jqResponseText);
        _this.getGoogleImageSearchUrl(jqResponseText, url, function (entryGoogleImageSearchUrl) {
            _this.getDateOfPublication(jqResponseText, function (entryDateOfPublication) {
                if (typeof entryEstSale === "undefined") entryEstSale = "0";
                if (typeof entrySalesRecv == "undefined") entrySalesRecv = "0";
                if (typeof reviews === "undefined") reviews = "0";
                if (typeof entrySalesRank === "undefined" || entrySalesRank.length < 1) entrySalesRank = "1";
                if (typeof entryPrintLength === "undefined" || entryPrintLength == '' || entryPrintLength == "NaN") entryPrintLength = "n/a";
                if (typeof entryAuthor === "undefined" || entryAuthor.length < 1) entryAuthor = "n/a";
                if (typeof entryImageUrl === "undefined")entryImageUrl = '';
                if (typeof entryRating === "undefined" || entryRating.length < 1) entryRating = '0';

                return callback({
                    title: entryTitle,
                    description: entryDescription,
                    price: (price == _this._siteParser.free) ? _this._siteParser.free : _this._siteParser.formatPrice(realPrice),
                    estSale: entryEstSale,
                    salesRecv: entrySalesRecv,
                    reviews: reviews,
                    salesRank: entrySalesRank,
                    printLength: entryPrintLength,
                    author: entryAuthor,
                    dateOfPublication: entryDateOfPublication,
                    googleSearchUrl: entryGoogleSearchUrl,
                    googleImageSearchUrl: entryGoogleImageSearchUrl,
                    imageUrl: entryImageUrl,
                    rating: entryRating
                });
            });
        });
    });
};