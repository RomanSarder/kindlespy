/**
 * Created by Andrey Klochkov on 12.10.2014.
 */

function BookPageParser(url, siteParser){
    this._siteParser = siteParser ? siteParser : GetSiteParser(url);
}

BookPageParser.prototype.isNotValid = function (){
    return this._siteParser === undefined;
};

BookPageParser.prototype.GetDateOfPublication = function(jqNodes, callback) {
    var pubdate = jqNodes.find('#pubdate').val();
    if(pubdate === undefined){
        var publisherElement = jqNodes.find('#productDetailsTable div.content li:contains(' + SiteParser.Publisher + ')');
        var dateOfPublication = ParseString(publisherElement.text(), '', '(', ')');

        return callback(dateOfPublication);
    }

    $.ajax({
        url: this._siteParser.MainUrl + "/gp/product/features/ebook-synopsis/formatDate.html",
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

BookPageParser.prototype.GetAuthorTitle = function(jqNodes) {
    return jqNodes.find('#productTitle').text().trim();
};

BookPageParser.prototype.GetGoogleSearchUrlByTitleAndAuthor = function(title, author){
    var baseUrl = "http://google.com/";
    var queryString = "";
    if((title !== undefined) && (title.length > 0))
        queryString += title;
    if((author !== undefined) && (author.length > 0))
        queryString += " " + author;
    queryString = encodeURIComponent(queryString).replace(/'/g, '%27');
    return baseUrl + "?q=" + queryString + "&oq=" + queryString + "#safe=off&q="+ queryString;
};

BookPageParser.prototype.GetGoogleImageSearchUrl = function(jqNodes, url, callback){
    var googleUrl = "https://www.google.com/";
    if(jqNodes === undefined || jqNodes.length == 0) {
        return callback(googleUrl);
    }
    this._siteParser.GetGoogleImageSearchUrlRel(jqNodes, url, function(rel){
        if (rel === undefined || rel.length<1)
            return callback(googleUrl);
        return callback(googleUrl + "searchbyimage?hl=en&image_url=" + rel);
    });
};

BookPageParser.prototype.GetImageUrl = function(jqNodes){
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    var src = this._siteParser.GetImageUrlSrc(jqNodes);
    if (src === undefined || src.length < 1) return '';
    return src;
};

BookPageParser.prototype.GetTitle = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.GetTitle(jqNodes);
};

BookPageParser.prototype.GetDescription = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.GetDescription(jqNodes);
};

BookPageParser.prototype.GetRating = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.GetRating(jqNodes);
};

BookPageParser.prototype.GetReviews = function(jqNodes) {
    if(jqNodes === undefined || jqNodes.length == 0) return '';
    return this._siteParser.GetReviews(jqNodes);
};

BookPageParser.prototype.GetPrice = function(jqNodes) {
    var priceBlock = jqNodes.find('#priceBlock b.priceLarge');
    if(priceBlock && priceBlock.text().trim() !== '') {
        if(priceBlock.text().trim() == "Free") return this._siteParser.FormatPrice("0" + this._siteParser.DecimalSeparator + "00");
         return priceBlock.text().trim();
    }
    priceBlock = jqNodes.find('#kindle_meta_binding_winner .price');
    return priceBlock ? priceBlock.text().trim() : "";
};

BookPageParser.prototype.GetSalesRank = function(jqNodes) {
    if (jqNodes === undefined || jqNodes.length == 0) return '0';

    // when page refreshed it can be undefined
    if (this._siteParser === undefined) return '0';
    var salesRankNodes = jqNodes.find("#SalesRank").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(salesRankNodes === undefined || salesRankNodes.length < 2) return '0';
    var salesRankString = salesRankNodes[1].nodeValue.trim();
    if(( salesRankString === undefined) || (salesRankString == "")) return '0';
    return salesRankString.substring(salesRankString.indexOf(this._siteParser.NumberSign) + this._siteParser.NumberSign.length, salesRankString.indexOf(' '));
};

BookPageParser.prototype.GetEstSale = function(salesRank) {
    var data = this._siteParser.EstSalesScale;
    if (typeof salesRank === "undefined") return 1;
    var sale = salesRank.toString().replace(this._siteParser.ThousandSeparator, "");

    for (var i = 0; i < data.length; i++) {
        if (sale >= data[i].min && sale <= data[i].max) return data[i].EstSale;
    }

    return "0";
};

BookPageParser.prototype.GetSalesRecv = function(estsales, price) {
    if (typeof estsales === "undefined") return price;

    return estsales * price;
};

BookPageParser.prototype.GetPrintLength = function(jqNodes) {
    return parseInt(jqNodes.find('#pageCountAvailable span').text()).toString();
};

BookPageParser.prototype.GetAuthor = function(jqNodes) {
    var author = jqNodes.find('.contributorNameTrigger>a').text().trim();
    if (author == ''){
        var asin = jqNodes.find('.contributorNameTrigger').attr('asin');
        author = jqNodes.find('#contributorContainer' + asin + ' b:first').text().trim();
    }

    return author;
};

BookPageParser.prototype.GetSalesRankFromUrl = function(url, callback) {
    var _this = this;

    $.get(url, function (responseText) {
        var jqResponse = parseHtmlToJquery(responseText);
        var salesRank = _this.GetSalesRank(jqResponse);
        if (!salesRank) salesRank = "1";
        callback(salesRank);
    });
};

BookPageParser.prototype.GetBookData = function(url, price, reviews, callback) {
    var _this = this;

    $.get(url, function (responseText) {
        var jqResponseText = parseHtmlToJquery(responseText);
        var entryTitle = _this.GetTitle(jqResponseText);
        if (entryTitle == '') entryTitle = _this.GetAuthorTitle(jqResponseText);
        if (entryTitle === undefined) return;
        var entryDescription = _this.GetDescription(jqResponseText);
        if (!reviews) reviews = _this.GetReviews(jqResponseText);
        if (!price) price = _this.GetPrice(jqResponseText);

        var entrySalesRank = _this.GetSalesRank(jqResponseText);
        var entryEstSale = _this.GetEstSale(entrySalesRank);
        var realPrice = _this._siteParser.ParsePrice(price);
        var entrySalesRecv = _this.GetSalesRecv(entryEstSale, realPrice);
        var entryPrintLength = _this.GetPrintLength(jqResponseText);
        var entryAuthor = _this.GetAuthor(jqResponseText);
        var entryGoogleSearchUrl = _this.GetGoogleSearchUrlByTitleAndAuthor(entryTitle, entryAuthor);
        var entryImageUrl = _this.GetImageUrl(jqResponseText);
        var entryRating = _this.GetRating(jqResponseText);
        _this.GetGoogleImageSearchUrl(jqResponseText, url, function (entryGoogleImageSearchUrl) {
            _this.GetDateOfPublication(jqResponseText, function (entryDateOfPublication) {
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
                    price: (price == _this._siteParser.Free) ? _this._siteParser.Free : _this._siteParser.FormatPrice(realPrice),
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