/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function MainTab(){
    if ( MainTab.prototype._singletonInstance )
        return MainTab.prototype._singletonInstance;
    MainTab.prototype._singletonInstance = this;

    this.pageNum = 1;
    this.IsPaged = true;
}

MainTab.prototype.SavePageNum = function(){
    Api.sendMessageToActiveTab({type: "save-pageNum", tab: 'MainTab', pageNum: this.pageNum});
};

MainTab.prototype.LoadPageNum = function(callback){
    var _this = this;
    callback = Helper.valueOrDefault(callback, function() {});
    Api.sendMessageToActiveTab({type: "get-pageNum", tab: 'MainTab'}, function(pageNum){
        _this.pageNum = parseInt(pageNum);
        callback();
    });
};

MainTab.prototype.ExportToCsv = function(data){
    var bookData = data.bookData;
    var x = new Array(this.pageNum * 20 + 1);
    for (var i = 0; i < this.pageNum * 20 + 1; i++) {
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
        if (Math.floor(index / 20) <= (this.pageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = bookData[index].Title;
            x[index + 1][2] = bookData[index].Author;
            x[index + 1][3] = bookData[index].DateOfPublication;
            x[index + 1][4] = bookData[index].Price.replace(SiteParser.currencySign, SiteParser.currencySignForExport);
            x[index + 1][5] = Helper.addCommas(bookData[index].EstSales);
            x[index + 1][6] = SiteParser.currencySignForExport + " " + Helper.addCommas(Math.round(bookData[index].SalesRecv));
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
    link.setAttribute("download", "bs-"+Helper.getCategoryFromBookData(bookData)+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
};

MainTab.prototype.InsertData = function(pageNumber, books, siteParser){
    var category = "";
    var categoryKind = "";
    var salesRankSum = 0;
    var salesRecvSum = 0;
    var priceSum = 0;
    var reviewSum = 0;
    var html = "";
    var nTotalCnt = 0;
    var cellCnt = 0;
 
    for(var i = books.length - 1; i >= 0 ; i --)
    {
        if (typeof books[i].SalesRank === "undefined" || books[i].SalesRank.length < 1)
        {
            books.splice(i, 1);
            continue;
        }

        if (typeof books[i].Title === "undefined" || books[i].Title.length < 1)
        {
            books.splice(i, 1);
            continue;
        }
    }

    for(var i = 0; i < books.length; i ++) {
        if (Math.floor(i / 20) <= pageNumber)
        {
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow'><a href="+books[i].Url+" target='_blank'>" + books[i].Title + "</a></td>" +
                "<td style='width:50px;'><a class='RankTrackingResultSingle' href='" + "#" + "' bookUrl='" + books[i].Url + "'>T</a> " + " | " +
                "<a target='_blank' href='" + books[i].GoogleSearchUrl + "' >S</a> " + " | " +
                "<a target='_blank' href='" + books[i].GoogleImageSearchUrl + "' >C</a>" + "</td>" +
                "<td style='padding-left:15px; width:30px;'>" +books[i].PrintLength + "</td>" +
                "<td style='width:50px;'>"+ books[i].Price +"</td>" +
                "<td style='width:60px;' align='center'>" + Helper.addCommas(books[i].EstSales) +"</td>" +
                "<td style='width:80px;'><div style='float:left'> "+ siteParser.currencySign +" </div> <div style='float:right'>"+ Helper.addCommas(Math.round(books[i].SalesRecv)) +"</div></td>" +
                "<td style='width:50px;' align='right'>"+ books[i].Reviews +"</td>" +
                "<td style='width:80px;padding-right : 10px;' align='right'>"+ books[i].SalesRank +"</td>"+
                "</tr>";

            var price = "" + books[i].Price;
            var review = "" + books[i].Reviews;

            salesRankSum += Helper.parseInt(books[i].SalesRank, siteParser.decimalSeparator);
            salesRecvSum += parseInt(books[i].SalesRecv);
            if (price.indexOf("free") >= 0)
                priceSum = 0;
            else
                priceSum += Helper.parseFloat(price, siteParser.decimalSeparator);

            reviewSum += Helper.parseInt(review, siteParser.decimalSeparator);

            nTotalCnt ++;

            if (category == "")
            {
                categoryKind = books[i].CategoryKind;
                category = books[i].Category;
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
        $('#result1').html(1 + "-" + (books.length));
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
	var salesRank20index = Math.min(19, books.length-1);
    var salesRank20 = Helper.parseInt(books[salesRank20index].SalesRank || 0, siteParser.decimalSeparator);
	
	var monthlyRev20 = 0;
	var salesRankConclusionValue = 0;
	var monthlyRevBook = 0;
	for (var i = 0; i < 20 && i < books.length; i++) {
        monthlyRev20 += parseInt(books[i].SalesRecv);
		if(this.GetSalesRankConclusion(Helper.parseInt(books[i].SalesRank, siteParser.decimalSeparator)) == 1) salesRankConclusionValue ++;
		if (books[i].SalesRecv > 500) monthlyRevBook ++;
	}
	var avgMonthlyRev20 = monthlyRev20/(Math.min(20, books.length));
	/*End region get data for analysis*/
    
	$('#result2').html(Helper.addCommas(Math.floor(salesRankSum / nTotalCnt)));
    $('#result3').html( siteParser.formatPrice(Helper.addCommas(Math.floor(salesRecvSum / nTotalCnt))));
    $('#result4').html(siteParser.formatPrice(Helper.addCommas((priceSum/nTotalCnt).toFixed(2))));
    $('#result5').html(Helper.addCommas(Math.floor(reviewSum / nTotalCnt)));
    $('#totalReSalesRecv').html(siteParser.formatPrice(Helper.addCommas(salesRecvSum)));
    this.Analysis = Helper.isSearchPageFromCategoryKind(categoryKind)? new SearchAnalysisAlgorithm() : new CategoryAnalysisAlgorithm();
    this.Analysis.setBullets({salesRank20: salesRank20,
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