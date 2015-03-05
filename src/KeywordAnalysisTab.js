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
    alert("TODO");
}

KeywordAnalysisTab.prototype.InsertData = function(pageNumber, obj, siteParser)
{
    var category = "";
    var categoryKind = "";
    var averageSalesRank = 0;
    var averageSalesRecv = 0;
    var averagePrice = 0;
    var averageReview = 0;
    var html = "";
    var nTotalCnt = 0;
    var cellCnt = 0;

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
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow'>" + obj[i].Title + "</td>" +
                "<td style='width:30px;'>"+ obj[i].Price +"</td>" +
                "<td style='padding-left:15px; width:30px;'>" +obj[i].PrintLength + "</td>" +
                "<td style='padding-left:15px; width:60px;' align='right'>" + "rating" +"</td>" +
                "<td style='width:50px;' align='right'>"+ obj[i].Reviews +"</td>" +
                "<td style='width:80px;padding-right : 10px;' align='right'>"+ obj[i].SalesRank +"</td>"+
                "</tr>";

            var price = "" + obj[i].Price;
            var review = "" + obj[i].Reviews;

            averageSalesRank += parseInt(obj[i].SalesRank.replace(SiteParser.ThousandSeparator, "").trim());
            averageSalesRecv += parseInt(obj[i].SalesRecv);
            if (price.indexOf("Free") >= 0)
                averagePrice = 0;
            else
                averagePrice += parseFloat(price.replace(/[^0-9\.]/g, ''));

            averageReview += parseInt(review.replace(SiteParser.ThousandSeparator, "").trim());
            nTotalCnt ++;

            if (category == "")
            {
                categoryKind = obj[i].CategoryKind;
                category = obj[i].Category;
                Category = category;
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

    addEventListenerForSingleResultBook();

    if (categoryKind.indexOf("Seller") >= 0)
        $("#CategoryKind").html("Best Sellers in");
    else if(categoryKind.indexOf("Search")>=0)
        $("#CategoryKind").html("Search Results");
    else
        $("#CategoryKind").html("Author Status");

    $("#title").html(category + ":");
    $('#result2').html(AddCommas(Math.floor(averageSalesRank / nTotalCnt)));
    $('#result3').html(SiteParser.FormatPrice(AddCommas(Math.floor(averageSalesRecv / nTotalCnt))));
    $('#result4').html(SiteParser.FormatPrice(AddCommas((averagePrice/nTotalCnt).toFixed(2))));
    $('#result5').html(AddCommas(Math.floor(averageReview / nTotalCnt)));
}
