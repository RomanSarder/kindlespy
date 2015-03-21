/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function KeywordAnalysisTab(){
    if ( KeywordAnalysisTab.prototype._singletonInstance )
        return KeywordAnalysisTab.prototype._singletonInstance;
    KeywordAnalysisTab.prototype._singletonInstance = this;

    this.PageNum = 1;
    this.IsPaged = true;
    this.Analysis = new SearchAnalysisAlgorithm();
}

KeywordAnalysisTab.prototype.SavePageNum = function(){
    chrome.runtime.sendMessage({type: "save-PageNum", tab: 'KeywordAnalysisTab', PageNum: this.PageNum});
};

KeywordAnalysisTab.prototype.LoadPageNum = function(callback){
    var _this = this;
    callback = ValueOrDefault(callback, function() {});
    chrome.runtime.sendMessage({type: "get-PageNum", tab: 'KeywordAnalysisTab'}, function(response){
        _this.PageNum = parseInt(response.PageNum);
        callback();
    });
};

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
    var salesRankConclusion = 0;
    var salesRankConclusionValue = 0;
    var monthlyRevBook = 0;
    var monthlyRevSum = 0;

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
            salesRankConclusion = this.GetSalesRankConclusion(obj[i].SalesRank);
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow' style='min-width:290px;max-width:290px;'><a href="+obj[i].Url+" target='_blank'>" + obj[i].Title + "</a></td>" +
                "<td style='min-width:40px;max-width:40px;padding-left:5px;padding-right:5px;'>"+ obj[i].Price +"</td>" +
                "<td class='bg-" + this.GetPagesColor(obj[i].PrintLength) + "' style='padding-left:18px;min-width:22px;max-width:22px;padding-right:18px;'>" +obj[i].PrintLength + "</td>" +
                "<td class='bg-" + this.GetKWColor(kwt) + "' style='padding-left:10px;min-width:22px;max-width:22px;padding-right:10px;'>" + kwt + "</td>" +
                "<td class='bg-" + this.GetKWColor(kwd) + "' style='padding-left:10px;min-width:22px;max-width:22px;padding-right:10px;'>" + kwd + "</td>" +
                "<td class='bg-" + this.GetRatingColor(obj[i].Rating) + "' style='padding-left:20px;min-width:20px;max-width:20px;padding-right:20px;'>" + Number(obj[i].Rating).toFixed(1) +"</td>" +
                "<td class='bg-" + this.GetReviewColor(obj[i].Reviews) + "' style='min-width:50px;max-width:50px;padding-left:20px;padding-right:10px;' align='right'>"+ obj[i].Reviews +"</td>" +
                "<td class='bg-" + this.GetSalesRankColor(salesRankConclusion) + "' align='right' style='padding-left:31px;width:70px;'>"+ obj[i].SalesRank +"</td>"+
                "</tr>";

            var price = "" + obj[i].Price;
            var review = "" + obj[i].Reviews;

            salesRankSum += parseInt(obj[i].SalesRank.replace(/[^0-9]/g, ''));
            if (price.indexOf("Free") >= 0)
                priceSum = 0;
            else
                priceSum += parseFloat(price.replace(/[^0-9\.]/g, ''));

            reviewSum += parseInt(review.replace(/[^0-9\.]/g, ''));
            pagesSum += $.isNumeric(obj[i].PrintLength) ? parseInt(obj[i].PrintLength) : 0;
            ratingSum += parseFloat(obj[i].Rating);
            if(salesRankConclusion == 3) salesRankConclusionValue ++;
            monthlyRevSum += obj[i].SalesRecv;
            if (monthlyRevSum < 500) monthlyRevBook ++;
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

    this.Analysis.SetBulletColor({
        salesRankConclusionValue: salesRankConclusionValue,
        monthlyRevBook: monthlyRevBook
    });

};

KeywordAnalysisTab.prototype.IsKeywordInText = function(keyWord, text){
    return text.toLowerCase().indexOf(keyWord.toLowerCase())!=-1 ? "Yes" : "No";
};

KeywordAnalysisTab.prototype.GetSalesRankConclusion = function(salesRankString){
    var salesRank = parseInt(salesRankString.replace(/[^0-9]/g, ''));
    if (salesRank < 10000) return 1;
    if (salesRank < 20000) return 2;
    if (salesRank < 50000) return 3;
    return 0;
};

KeywordAnalysisTab.prototype.GetSalesRankColor = function(salesRankConclusion){
    if (salesRankConclusion == 1) return 'red';
    if (salesRankConclusion == 2) return 'orange';
    if (salesRankConclusion == 3) return 'green';
    return 'grey';
};

KeywordAnalysisTab.prototype.GetRatingColor = function(rating){
    if (rating == '') return 'grey';
    if (rating < 4) return 'green';
    if (rating < 4.5) return 'orange';
    return 'red';
};

KeywordAnalysisTab.prototype.GetReviewColor = function(reviewString){
    var review = parseInt(reviewString.replace(/[^0-9]/g, ''));
    if (review == '' || review == 0) return 'grey';
    if (review < 21) return 'green';
    if (review < 76) return 'orange';
    return 'red';
};

KeywordAnalysisTab.prototype.GetKWColor = function(keyword){
    if (keyword.toLowerCase() == 'yes') return 'red';
    return 'green';
};

KeywordAnalysisTab.prototype.GetPagesColor = function(pages){
    if (!$.isNumeric(pages)) return 'grey';
    if (pages < 66) return 'green';
    if (pages < 150) return 'orange';
    return 'red';
};
