/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function KeywordAnalysisTab(){
    if ( KeywordAnalysisTab.prototype._singletonInstance )
        return KeywordAnalysisTab.prototype._singletonInstance;
    KeywordAnalysisTab.prototype._singletonInstance = this;

    this.PageNum = 1;
    this.IsPaged = true;
}

KeywordAnalysisTab.prototype.SavePageNum = function(){
    chrome.runtime.sendMessage({type: "save-PageNum", tab: 'KeywordAnalysisTab', PageNum: this.PageNum});
}

KeywordAnalysisTab.prototype.LoadPageNum = function(callback){
    var _this = this;
    callback = ValueOrDefault(callback, function() {});
    chrome.runtime.sendMessage({type: "get-PageNum", tab: 'KeywordAnalysisTab'}, function(response){
        _this.PageNum = parseInt(response.PageNum);
        callback();
    });
}

KeywordAnalysisTab.prototype.ExportToCsv = function(data){
    var bookData = data.bookData;
    var x = new Array(this.PageNum * 20 + 1);
    for (var i = 0; i < this.PageNum * 20 + 1; i++) {
        x[i] = new Array(9);
    }

    x[0][0] = "#";
    x[0][1] = "Kindle Book Title";
    x[0][2] = "Price";
    x[0][3] = "Page No(s)";
    x[0][4] = "KWT";
    x[0][5] = "KWD";
    x[0][6] = "Rating";
    x[0][7] = "Reviews";
    x[0][8] = "Sales Rank";

    for(var index = 0; index < bookData.length; index ++) {
        if (Math.floor(index / 20) <= (this.PageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = bookData[index].Title;
            x[index + 1][2] = bookData[index].Price.replace(SiteParser.CurrencySign, SiteParser.CurrencySignForExport);
            x[index + 1][3] = bookData[index].PrintLength;
            x[index + 1][4] = this.IsKeywordInText(bookData[index].Category, bookData[index].Title);
            x[index + 1][5] = this.IsKeywordInText(bookData[index].Category, bookData[index].Description);
            x[index + 1][6] = bookData[index].Rating;
            x[index + 1][7] = bookData[index].Reviews;
            x[index + 1][8] = bookData[index].SalesRank;
        }
    }

    var csvContent = "\uFEFF";
    x.forEach(function(infoArray, index){
        if (index <= bookData.length)
        {
            var dataString = [];
            for (var i = 0; i < infoArray.length; i++)
            {
                var quotesRequired = false;
                if (infoArray[i].indexOf(",") >= 0)
                    quotesRequired = true;
                var escapeQuotes = false;
                if (infoArray[i].indexOf("\"") >= 0)
                    escapeQuotes = true;

                var fieldValue = (escapeQuotes ? infoArray[i].replace("\"", "\"\"") : infoArray[i]);

                if (fieldValue.indexOf("\r") >= 0 || fieldValue.indexOf("\n") >= 0)
                {
                    quotesRequired = true;
                    fieldValue = fieldValue.replace("\r\n", "");
                    fieldValue = fieldValue.replace("\r", "");
                    fieldValue = fieldValue.replace("\n", "");
                }

                dataString[i] = (quotesRequired || escapeQuotes ? "\"" : "") + fieldValue + (quotesRequired || escapeQuotes ? "\"" : "") + ((i < (infoArray.length-1)) ? "," : "\r\n");
            }
            for (var i = 0; i < dataString.length; i ++)
                csvContent += dataString[i];
        }
    });

    var blob = new Blob([csvContent], {type : 'text/csv', charset : 'utf-8', encoding:'utf-8'});
    var url = URL.createObjectURL(blob);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ka-"+GetCategoryFromBookData(bookData)+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
}

KeywordAnalysisTab.prototype.InsertData = function(pageNumber, obj, siteParser)
{
    var category = "";
    var categoryKind = "";
    var salesRankSum = 0;
    var pagesSum = 0;
    var ratingSum = 0;
    var priceSum = 0;
    var reviewSum = 0;
    var html = "";
    var nTotalCnt = 0;
    var salesRank20 = 0;

    for(var i = obj.length - 1; i >= 0 ; i --)
    {
        if (typeof obj[i].SalesRank === "undefined" || obj[i].SalesRank.length < 1)
        {
            obj.splice(i, 1);
            continue;
        }

        if (typeof obj[i].Title === "undefined" || obj[i].Title.length < 1)
        {
            obj.splice(i, 1);
            continue;
        }
    }

    for(var i = 0; i < obj.length; i ++) {
        if (Math.floor(i / 20) <= pageNumber)
        {
            var kwt = this.IsKeywordInText(obj[i].Category, obj[i].Title);
            var kwd = this.IsKeywordInText(obj[i].Category, obj[i].Description);
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow' style='min-width:290px;max-width:290px;'>" + obj[i].Title + "</td>" +
                "<td style='min-width:40px;max-width:40px;padding-left:5px;padding-right:5px;'>"+ obj[i].Price +"</td>" +
                "<td class='bg-" + this.GetPagesColor(obj[i].PrintLength) + "' style='padding-left:18px;min-width:22px;max-width:22px;padding-right:18px;'>" +obj[i].PrintLength + "</td>" +
                "<td class='bg-" + this.GetKWColor(kwt) + "' style='padding-left:10px;min-width:22px;max-width:22px;padding-right:10px;'>" + kwt + "</td>" +
                "<td class='bg-" + this.GetKWColor(kwd) + "' style='padding-left:10px;min-width:22px;max-width:22px;padding-right:10px;'>" + kwd + "</td>" +
                "<td class='bg-" + this.GetRatingColor(obj[i].Rating) + "' style='padding-left:20px;min-width:20px;max-width:20px;padding-right:20px;'>" + Number(obj[i].Rating).toFixed(1) +"</td>" +
                "<td class='bg-" + this.GetReviewColor(obj[i].Reviews) + "' style='min-width:50px;max-width:50px;padding-left:20px;padding-right:10px;' align='right'>"+ obj[i].Reviews +"</td>" +
                "<td class='bg-" + this.GetSalesRankColor(obj[i].SalesRank.replace(SiteParser.ThousandSeparator, "").trim()) + "' align='right' style='padding-left:31px;width:70px;'>"+ obj[i].SalesRank +"</td>"+
                "</tr>";

            var price = "" + obj[i].Price;
            var review = "" + obj[i].Reviews;

            salesRankSum += parseInt(obj[i].SalesRank.replace(SiteParser.ThousandSeparator, "").trim());
            if (price.indexOf("Free") >= 0)
                priceSum = 0;
            else
                priceSum += parseFloat(price.replace(/[^0-9\.]/g, ''));

            reviewSum += parseInt(review.replace(SiteParser.ThousandSeparator, "").trim());
            pagesSum += $.isNumeric(obj[i].PrintLength) ? parseInt(obj[i].PrintLength) : 0;
            ratingSum += parseFloat(obj[i].Rating);
            nTotalCnt ++;

            if (category == "")
            {
                categoryKind = obj[i].CategoryKind;
                category = obj[i].Category;
            }
        }
    }

    if (pageNumber * 20 >= 20)
    {
        $('#data-body').css("overflow-y" , "scroll");
    }

    var min = (pageNumber + 1) * 20 - 19;
    var max = (pageNumber + 1) * 20;

    if (pageNumber >= 4)
    {
        $('#result1').html(1 + "-" + (obj.length));
        $('#PullResult').html("");
    }
    else
    {
        $('#result1').html(1 + "-" + max);
        $('#PullResult').html("Pull Results " + (min + 20) + "-" + (max + 20));
    }

    $("table[name='data']").find("tbody").html(html);

    $('#result2').html(SiteParser.FormatPrice(AddCommas((priceSum/nTotalCnt).toFixed(2))));
    $('#result3').html(AddCommas(Math.floor(salesRankSum / nTotalCnt)));
    $('#result4').html(AddCommas(Math.floor(pagesSum/ nTotalCnt)));
    $('#result5').html(AddCommas((ratingSum/ nTotalCnt).toFixed(1)));
    $('#result6').html(AddCommas(Math.floor(reviewSum / nTotalCnt)));

    for (var i = 0; i < 20 && i < obj.length; i++) {
        salesRank20 += parseInt(obj[i].SalesRank.replace(SiteParser.ThousandSeparator, "").trim() || 0);
    }

    var keywordConclusion = this.GetKeywordConclusion(salesRank20 / 20);
    $('#KWDConclusionValue').html(this.GetKeywordConclusionValue(keywordConclusion));
    $('#KWDConclusionImage').removeClass().addClass('information-' + this.GetKeywordConclusionColor(keywordConclusion));
    $('#KWDConclusionImage').tooltipster('content', this.GetKeywordConclusionTooltip(keywordConclusion));

}

KeywordAnalysisTab.prototype.IsKeywordInText = function(keyWord, text){
    return text.toLowerCase().indexOf(keyWord.toLowerCase())!=-1 ? "Yes" : "No";
}

KeywordAnalysisTab.prototype.GetSalesRankColor = function(salesRankString){
    var salesRank = parseInt(salesRankString.replace(/,/g,''));
    if (salesRank < 10000) return 'red';
    if (salesRank < 20000) return 'orange';
    if (salesRank < 50000) return 'green';
    return 'grey';
}

KeywordAnalysisTab.prototype.GetRatingColor = function(rating){
    if (rating == '') return 'grey';
    if (rating < 4) return 'green';
    if (rating < 4.5) return 'orange';
    return 'red';
}

KeywordAnalysisTab.prototype.GetReviewColor = function(reviewString){
    var review = parseInt(reviewString.replace(/,/g,''));
    if (review == '' || review == 0) return 'grey';
    if (review < 21) return 'green';
    if (review < 76) return 'orange';
    return 'red';
}

KeywordAnalysisTab.prototype.GetKWColor = function(keyword){
    if (keyword.toLowerCase() == 'yes') return 'red';
    return 'green';
}

KeywordAnalysisTab.prototype.GetPagesColor = function(pages){
    if (!$.isNumeric(pages)) return 'grey';
    if (pages < 66) return 'green';
    if (pages < 150) return 'orange';
    return 'red';
}

KeywordAnalysisTab.prototype.GetKeywordConclusion = function(salesRank){
    if (salesRank < 2000) return 6;
    if (salesRank < 5000) return 5;
    if (salesRank < 10000) return 4;
    if (salesRank < 25000) return 3;
    if (salesRank < 50000) return 2;
    if (salesRank < 100000) return 1;
    return 0;
}

KeywordAnalysisTab.prototype.GetKeywordConclusionValue = function(keywordConclusion){
    if(keywordConclusion == 0) return 'Very Poor';
    if(keywordConclusion == 1) return 'Poor';
    if(keywordConclusion == 2 || keywordConclusion == 3) return 'Good';
    if(keywordConclusion == 4 || keywordConclusion == 5) return 'Difficult';
    return 'Very Difficult'; // keywordConclusion == 6
}

KeywordAnalysisTab.prototype.GetKeywordConclusionColor = function(keywordConclusion){
    if(keywordConclusion == 0 || keywordConclusion == 1) return 'grey';
    if(keywordConclusion == 2 || keywordConclusion == 3) return 'green';
    if(keywordConclusion == 4 || keywordConclusion == 5) return 'orange';
    return 'red'; // keywordConclusion == 6
}

KeywordAnalysisTab.prototype.GetKeywordConclusionTooltip = function(keywordConclusion){
    if(keywordConclusion == 0) return 'This keyword get no traffic and all the books here are selling very poorly.';
    if(keywordConclusion == 1) return 'This keyword get little traffic and the majority of the books here are selling poorly.';
    if(keywordConclusion == 2 || keywordConclusion == 3) return 'This keyword gets traffic and has little competition making this a good keyword to target.';
    if(keywordConclusion == 4 || keywordConclusion == 5) return 'This keyword gets traffic but the competition here makes this a difficult choice.';
    return 'This keyword gets a lot of traffic but the competition here is very tough.'; // keywordConclusion == 6
}
