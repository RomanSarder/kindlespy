/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function MainTab(){
    if ( MainTab.prototype._singletonInstance )
        return MainTab.prototype._singletonInstance;
    MainTab.prototype._singletonInstance = this;

    this.PageNum = 1;
    this.IsPaged = true;
}

MainTab.prototype.SavePageNum = function(){
    Popup.sendMessage({type: "save-PageNum", tab: 'MainTab', PageNum: this.PageNum});
};

MainTab.prototype.LoadPageNum = function(callback){
    var _this = this;
    callback = ValueOrDefault(callback, function() {});
    Popup.sendMessage({type: "get-PageNum", tab: 'MainTab'}, function(response){
        _this.PageNum = parseInt(response.PageNum);
        callback();
    });
};

MainTab.prototype.ExportToCsv = function(data){
    var bookData = data.bookData;
    var x = new Array(this.PageNum * 20 + 1);
    for (var i = 0; i < this.PageNum * 20 + 1; i++) {
        x[i] = new Array(11);
    }

    x[0][0] = "#";
    x[0][1] = "Kindle Book Title";
    x[0][2] = "Author";
    x[0][3] = "Date of publication";
    x[0][4] = "Price";
    x[0][5] = "Est. Sales";
    x[0][6] = "Sales Rev.";
    x[0][7] = "Reviews";
    x[0][8] = "Sales Rank";
    x[0][9] = "Page No(s)";
    x[0][10] = "Book URL";

    for(var index = 0; index < bookData.length; index ++) {
        if (Math.floor(index / 20) <= (this.PageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = bookData[index].Title;
            x[index + 1][2] = bookData[index].Author;
            x[index + 1][3] = bookData[index].DateOfPublication;
            x[index + 1][4] = bookData[index].Price.replace(SiteParser.CurrencySign, SiteParser.CurrencySignForExport);
            x[index + 1][5] = AddCommas(bookData[index].EstSales);
            x[index + 1][6] = SiteParser.CurrencySignForExport + " " + AddCommas(Math.round(bookData[index].SalesRecv));
            x[index + 1][7] = bookData[index].Reviews;
            x[index + 1][8] = bookData[index].SalesRank;
            x[index + 1][9] = bookData[index].PrintLength;
            x[index + 1][10] = bookData[index].Url;
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

                if(i == 10 && index > 0)
                    fieldValue =  "=HYPERLINK(\"" + fieldValue + "\")";
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
    link.setAttribute("download", "bs-"+GetCategoryFromBookData(bookData)+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
};

MainTab.prototype.InsertData = function(pageNumber, obj, siteParser){
    var category = "";
    var categoryKind = "";
    var salesRankSum = 0;
    var salesRecvSum = 0;
    var priceSum = 0;
    var reviewSum = 0;
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
                "<td class='wow'><a href="+obj[i].Url+" target='_blank'>" + obj[i].Title + "</a></td>" +
                "<td style='width:50px;'><a class='RankTrackingResultSingle' href='" + "#" + "' bookUrl='" + obj[i].Url + "'>T</a> " + " | " +
                "<a target='_blank' href='" + obj[i].GoogleSearchUrl + "' >S</a> " + " | " +
                "<a target='_blank' href='" + obj[i].GoogleImageSearchUrl + "' >C</a>" + "</td>" +
                "<td style='padding-left:15px; width:30px;'>" +obj[i].PrintLength + "</td>" +
                "<td style='width:50px;'>"+ obj[i].Price +"</td>" +
                "<td style='width:60px;' align='center'>" + AddCommas(obj[i].EstSales) +"</td>" +
                "<td style='width:80px;'><div style='float:left'> "+ siteParser.CurrencySign +" </div> <div style='float:right'>"+ AddCommas(Math.round(obj[i].SalesRecv)) +"</div></td>" +
                "<td style='width:50px;' align='right'>"+ obj[i].Reviews +"</td>" +
                "<td style='width:80px;padding-right : 10px;' align='right'>"+ obj[i].SalesRank +"</td>"+
                "</tr>";

            var price = "" + obj[i].Price;
            var review = "" + obj[i].Reviews;

            salesRankSum += HelperFunctions.parseInt(obj[i].SalesRank, siteParser.DecimalSeparator);
            salesRecvSum += parseInt(obj[i].SalesRecv);
            if (price.indexOf("Free") >= 0)
                priceSum = 0;
            else
                priceSum += HelperFunctions.parseFloat(price, siteParser.DecimalSeparator);

            reviewSum += HelperFunctions.parseInt(review, siteParser.DecimalSeparator);

            nTotalCnt ++;

            if (category == "")
            {
                categoryKind = obj[i].CategoryKind;
                category = obj[i].Category;
            }
        }
    }

    if (this.IsPaged && pageNumber * 20 >= 20)
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

    /*Start region: get data for analysis*/
	var salesRank20index = Math.min(19, obj.length-1);
    var salesRank20 = HelperFunctions.parseInt(obj[salesRank20index].SalesRank || 0, siteParser.DecimalSeparator);
	
	var monthlyRev20 = 0;
	var salesRankConclusionValue = 0;
	var monthlyRevBook = 0;
	for (var i = 0; i < 20 && i < obj.length; i++) {
        monthlyRev20 += parseInt(obj[i].SalesRecv);
		if(this.GetSalesRankConclusion(HelperFunctions.parseInt(obj[i].SalesRank, siteParser.DecimalSeparator)) == 1) salesRankConclusionValue ++;
		if (obj[i].SalesRecv > 500) monthlyRevBook ++;
	}
	var avgMonthlyRev20 = monthlyRev20/(Math.min(20, obj.length));
	/*End region get data for analysis*/
    
	$('#result2').html(AddCommas(Math.floor(salesRankSum / nTotalCnt)));
    $('#result3').html( siteParser.FormatPrice(AddCommas(Math.floor(salesRecvSum / nTotalCnt))));
    $('#result4').html(siteParser.FormatPrice(AddCommas((priceSum/nTotalCnt).toFixed(2))));
    $('#result5').html(AddCommas(Math.floor(reviewSum / nTotalCnt)));
    $('#totalReSalesRecv').html(siteParser.FormatPrice(AddCommas(salesRecvSum)));
    this.Analysis = IsSearchPageFromCategoryKind(categoryKind)? new SearchAnalysisAlgorithm() : new CategoryAnalysisAlgorithm();
    this.Analysis.SetBullets({salesRank20: salesRank20,
        avgMonthlyRev:avgMonthlyRev20,
        salesRankConclusionValue: salesRankConclusionValue,
        monthlyRevBook:monthlyRevBook});
};

MainTab.prototype.GetSalesRankConclusion = function(salesRank){
    if (salesRank < 10000) return 1;
    if (salesRank < 20000) return 2;
    if (salesRank < 50000) return 3;
    return 0;
};