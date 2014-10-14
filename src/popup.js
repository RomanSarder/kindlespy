var Category;
var obj = [];
var clouds = [];
var PageNum = 1;
var CurrentPageUrl = "";
var refreshed = false;
var bIsSellWin = true;
var IsErrorWindow = false;
var SiteParser;
var Storage = new BookStorage();
var columnGetterFunctions = [];
columnGetterFunctions['no'] = function(a){return parseInt(a.No)};
columnGetterFunctions['pageno'] = function(a){
    var printLength = parseInt(a.PrintLength);
    return isNaN(printLength) ? 0 : printLength;
};
columnGetterFunctions['title-book'] = function(a){return a.Title};
columnGetterFunctions['price'] = function(a){return parseFloat(a.Price.replace(/[^0-9\.]/g, ''))};
columnGetterFunctions['est-sales'] = function(a){return a.EstSales};
columnGetterFunctions['sales-rev'] = function(a){return a.SalesRecv};
columnGetterFunctions['reviews'] = function(a){return parseInt(a.Reviews.replace(/,/g,''))};
columnGetterFunctions['sales-rank'] = function(a){return parseInt(a.SalesRank.replace(/,/g,''))};

var currentSortColumn = 'no';
var currentSortDirection = 1; //1 = ask, -1 = desc

$(window).ready(function () {
    $('#LinkBackTo').click(function () {
        $('#data-body').css("overflow-y", "auto");
        bIsSellWin = true;
        frun();
    });
    $('#enableTracking').click(function () {
        $('#enableTracking').prop('disabled', true);
        $('#LinkBackTo').hide();
        var _this = this;
        Storage.EnableTracking($(_this).data().url, function() {
            $('#enableTracking').prop('disabled', false);
            $('#LinkBackTo').show();
            RankTrackingSingleShow($(_this).data().url);
        });
    });
    $('#disableTracking').click(function () {
        var _this = this;
        Storage.DisableTracking($(_this).data().url, function(bytesInUse) {
            RankTrackingSingleShow($(_this).data().url);
        });
    });
});

function resetCss(){
    // header
    $('#main-header').hide();
    $('#tracking-header').hide();

    // info
    $('.info.single_book').hide();
    $('.info.list_books').hide();
    $('.info.single_book .info-item').css('width', '');
    $('#infoPages').hide();

    // content
    $('#word-cloud-content').hide();
    $('#no-data-found-content').hide();
    $('#main-content').hide();
    $('#tracking-content').hide();
    $('.right-panel').hide();
    $('.left-panel').css('width', '');

    // footer
    $('#WordCloudFooter').hide();
    $('#BestSellersRankingFooter').hide();
    $('#NoDataFooter').hide();
    $('#ExportBtn').hide();
    $('#TrackedPanelFooter').hide();
    $('#BookTracked').hide();
}

function AutoAddFunc()
{
    var url = CurrentPageUrl;
    var IsFreeUrl = false;
    var currentUrl = url;

    if (currentUrl.indexOf("ref=zg_bs_fvp_p_f") >= 0 || currentUrl.indexOf("&tf=") >= 0)
        IsFreeUrl = true;

    if(url.indexOf("/s/")>=0)
    {
       currentUrl = url.replace(/\&page=[0-9]+/, "");	
    }
    else if (url.indexOf("/ref=") >= 0)
    {
        var _Pos = url.lastIndexOf('/ref=');
        currentUrl = url.substr(0, _Pos);
    }
    chrome.runtime.sendMessage({type: "get-settings"}, function(response) {
        settings = response.settings;

        var settingLen = settings.Book.length;

        var settingInfo;
        while(obj.length > 0) {
            obj.pop();
        }
        for (var i = 0; i < settingLen; i++)
        {
            if (settings.Book[i].ParentUrl === currentUrl)
            {
                if (IsFreeUrl)
                {
                    if (settings.Book[i].Price.indexOf("Free") >= 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl };
                        obj.push(settingTmp);
                    }
                }
                else
                {
                    if (settings.Book[i].Price.indexOf("Free") < 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl };
                        obj.push(settingTmp);
                    }
                }
            }
        }

        obj.sort(compare);

        if (IsErrorWindow && obj.length > 0)
        {
            frun();
        }
        else if (!refreshed && bIsSellWin)
        {	
			if (obj.length > 0)
			{
				if (PageNum > 1)
					InsertDatas(PageNum-1);
	            else if (obj.length > 0)
					InsertDatas(0);
			}
        }
    });

    if (!refreshed)
    {
        setTimeout(AutoAddFunc, 1000);
    }
}

function wordSort(a, b)
{
    if (parseInt(a.Len) < parseInt(b.Len))
        return -1;
    if (parseInt(a.Len) > parseInt(b.Len))
        return 1;
    return 0;
}

function shuffle(array) {
    var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function ExportWordCloudResult()
{
    var x = new Array(clouds.length + 1);

    for (var i = 0; i < clouds.length + 1; i++) {
        x[i] = new Array(2);
    }

    x[0][0] = "Words";
    x[0][1] = "Count";

    var nArrayIndex = 1;
    for(var index = clouds.length-1; index >= 0 ; index --) {
        x[nArrayIndex][0] = clouds[index].Word;
        x[nArrayIndex][1] = clouds[index].Len.toString();
        nArrayIndex++;
    }

    var csvContent = "data:text/csv;charset=utf-8,";
    x.forEach(function(infoArray, index){
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
    });

    var encodedUri = encodeURI(csvContent);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wc-"+Category+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
}

function WordsInfoUpdate()
{
    var xPathRes = document.evaluate ( "/html/body/div/div/div/div/table/tbody/tr/td[2]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var InnerTexts = "";

    if (xPathRes.length < 1)
        return;

    for (var i = 0; i < xPathRes.snapshotLength; i++) {
        if (i > PageNum * 20)
            break;

        InnerTexts += xPathRes.snapshotItem (i).innerText + " ";
    }

    InnerTexts = InnerTexts.toLowerCase();

    InnerTexts = InnerTexts.replace(/ the /g, ' ');
    InnerTexts = InnerTexts.replace(/the /g, ' ');
    InnerTexts = InnerTexts.replace(/ a /g, ' ');
    InnerTexts = InnerTexts.replace(/ of /g, ' ');
    InnerTexts = InnerTexts.replace(/ i /g, ' ');
    InnerTexts = InnerTexts.replace(/ and /g, ' ');
    InnerTexts = InnerTexts.replace(/ in /g, ' ');
    InnerTexts = InnerTexts.replace(/ at /g, ' ');
    InnerTexts = InnerTexts.replace(/-/g, ' ');
    InnerTexts = InnerTexts.replace(/\d+/g, ' ');
    InnerTexts = InnerTexts.replace(/ and /g, ' ');
    InnerTexts = InnerTexts.replace(/ to /g, ' ');
    InnerTexts = InnerTexts.replace(/to /g, ' ');
    InnerTexts = InnerTexts.replace(/:/g, ' ');
    InnerTexts = InnerTexts.replace(/ at /g, ' ');
    InnerTexts = InnerTexts.replace(/at /g, ' ');
    InnerTexts = InnerTexts.replace(/ for /g, ' ');
    InnerTexts = InnerTexts.replace(/we /g, ' ');
    InnerTexts = InnerTexts.replace(/you /g, ' ');
    InnerTexts = InnerTexts.replace(/me /g, ' ');
    InnerTexts = InnerTexts.replace(/'/g, ' ');
    InnerTexts = InnerTexts.replace(/ our /g, ' ');
    InnerTexts = InnerTexts.replace(/,/g, ' ');
    InnerTexts = InnerTexts.replace(/will /g, ' ');
    InnerTexts = InnerTexts.replace(/ will /g, ' ');
    InnerTexts = InnerTexts.replace(/[()]/g, ' ');
    InnerTexts = InnerTexts.replace(/[{}]/g, ' ');
    InnerTexts = InnerTexts.replace(/\[/g, ' ');
    InnerTexts = InnerTexts.replace(/\]/g, ' ');
    InnerTexts = InnerTexts.replace(/&/g, ' ');
    InnerTexts = InnerTexts.replace(/\//g, ' ');
    InnerTexts = InnerTexts.replace(/!/g, ' ');

    var words = InnerTexts.split(" ");

    while(clouds.length > 0) {
        clouds.pop();
    }

    for (var i = 0; i < words.length; i++)
    {
        if ((typeof words[i] === "undefined") || (words[i].length < 1))
            continue;

        var found = false;
        for(var j = 0; j < clouds.length; j++) {
            if (clouds[j].Word == words[i]) {
                found = true;
                break;
            }
        }

        if (!found)
        {
            var nDuplicateCnt = 0
            for (var n = 0; n < words.length; n++)
            {
                if (words[i] === words[n])
                    nDuplicateCnt++;
            }

            clouds.push({"Len":nDuplicateCnt, "Word": words[i]});
        }

    }

    clouds.sort(wordSort);

    var nCnt = 0;

    var InfoHtml = "<div style=\"font-size:11px;color:#a8a8a8;padding-top: 1px\">" + "Showing top 50 of " + (clouds.length - 1) + " possible words:</div>";

    $('.info.list_books').html(InfoHtml);
    var level = [];

    var nlevelIndex = 0;
    for (var i = clouds.length - 1; i >= 0; i--)
    {
        var found = false;
        for(var j = 0; j < clouds.length; j++) {
            if (clouds[j].Len == level[i]) {
                found = true;
                break;
            }
        }

        if (!found)
        {
            if (clouds[i].Word.length > 2)
            {
                level[nlevelIndex] = clouds[i].Len;
                nlevelIndex++;
            }
        }

        if (nlevelIndex >= 6)
            break;
    }

    var ColudLevel = 1;
    var contentHtml = "";
    nCnt = 0;

    var ShuffleArray = [];

    for (var i = clouds.length - 1; i >= 0; i--)
    {
        ColudLevel = 6;
        for (var j = 0; j < level.length; j++)
        {
            if (clouds[i].Len === level[j])
            {
                ColudLevel = j + 1;
                break;
            }
        }

        if (clouds[i].Word.length > 2)
        {
            if (clouds[i].Len < 2)
                ShuffleArray.push({Level:6, Word:clouds[i].Word, Len:clouds[i].Len});
            else
                ShuffleArray.push({Level:ColudLevel, Word:clouds[i].Word, Len:clouds[i].Len});
        }

        if (nCnt >= 50)
            break;

        nCnt++;
    }

    ShuffleArray = shuffle(ShuffleArray);

    for (var i = 0; i < ShuffleArray.length; i++)
    {
        contentHtml += "<span class=\"occurcnt\"><span class=\"best" + ShuffleArray[i].Level + "\">" + "&nbsp;" + ShuffleArray[i].Word + "</span>(" + ShuffleArray[i].Len + ")&nbsp;</span>";
    }

    $('#word-cloud-content').html(contentHtml);

    var wordsHTML = "";
    nCnt = 1;
    for (var i = clouds.length - 1; i >= 0; i--)
    {
        if (clouds[i].Word.length > 2)
        {
            wordsHTML += (nCnt + ". <b style='padding-right : 15px;'>" + clouds[i].Word + "</b>&nbsp;&nbsp;&nbsp;&nbsp;");
            if (nCnt >= 5)
                break;

            nCnt++;
        }
    }

    $('.table-head').html("");

    resetCss();

    $('#Words').html(wordsHTML);
    $('#main-header').show();
    $('#word-cloud-content').show();
    $('.info.list_books').show();
    $('#WordCloudFooter').show();
    $('#ExportBtn').show();

    LoadAdvertisementBanner();
}
function RankTrackingListShow() {
    var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:350px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"daysTracked\" style=\"padding-right:35px;\">Days Tracked</label><label class=\"sort-column\" id=\"resTracking\" style=\"padding-right:45px;\">Tracking</label><label class=\"sort-column\" id=\"removeTracking\" style=\"padding-right:5px;\">Action</label>";
    var info = "<div style=\"font-size:15px;\"><b>Best Seller Rank Tracking:</b></div>";
    $('#main-header').html('');
    $('#main-content').html(ContentHtml);
    $('.info.list_books').html(info);
    resetCss();
    $('#main-header').show();
    $('#main-content').show();
    $('#TrackedPanelFooter').show();
    $('.info.list_books').show();

    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y", "auto");
    $('.table-head').html(tableHead);
    $('.table-head').css("background-color", "#333333");

    UpdateRateTrackingTable();
}

var prevBookUrl;
function resetTrackingBookPage(bookUrl) {
    if(prevBookUrl === bookUrl) return;
    prevBookUrl = bookUrl;
    $('#singleResult1').html('');
    $('#singleResult2').html('');
    $('#singleResult3').html('');
    $('#singleResult4').html('');
    $('#singleResult5').html('');
    $('#singleResult6').html('');
    $('#days').html('');
    $('#AvgSalesRank').html('');
    $('#EstDailyRev').html('');
    $('#authorName').html('');
    $('#bookImage').attr('src','');
    $('#enableTracking').show();
    $('#enableTracking').prop('disabled', true);
    $('#disableTracking').hide();
}

function RankTrackingSingleShow(bookUrl){
    resetCss();
    resetTrackingBookPage(bookUrl);
    $('#tracking-header').show();
    $('#tracking-content').show();
    $('#ExportBtn').show();
    $('#TrackedPanelFooter').show();
    $('#BookTracked').show();
    $('.info.single_book').show();
    $('.right-panel').show();
    $(".table-head").html("<label>Bestseller rank tracking(30 days)<label>");

    LoadAdvertisementBanner();

    $('.left-panel').css("width", "525px");

    $('#main-header').html('');
    $('#tracking-content').html('');

    $('#LinkBackTo').hide();
    Storage.GetBook(bookUrl, function(bookData) {
        if(bookData) {
            UpdateTrackedBookView(bookData);
            return;
        }

        Storage.InitBookFromUrl(bookUrl, UpdateTrackedBookView);
    });
}

function UpdateTrackedBookView(bookData){
    var contentHtml = '';
    $('#bookTitle').text(bookData.title);
    if(bookData.trackingEnabled){
        contentHtml = '<div><canvas id="canvas" height="290" width="520"></canvas></div>';
        $('#infoPages').show();
        $('.info.single_book .info-item').css('width', '16%');
    }
    else {
        contentHtml = '<div class="brtdisable"><div>Bestseller Rank Tracking</div><div>Currently Disabled</div></div>';
        $('#enableTracking').prop('disabled', false);
    }
    $('#tracking-header').show();
    $('#LinkBackTo').show();
    $('#tracking-content').html(contentHtml);
    $('#enableTracking').toggle(!bookData.trackingEnabled);
    $('#disableTracking').toggle(bookData.trackingEnabled);
    $('#enableTracking').data({url: bookData.url});
    $('#disableTracking').data({url: bookData.url});

    $('#singleResult1').html(bookData.currentSalesRank);
    $('#singleResult2').html(bookData.price);
    $('#singleResult3').html(bookData.pages);
    $('#singleResult4').html(addCommas(bookData.estSales));
    $('#singleResult5').html(SiteParser.FormatPrice(addCommas(Math.round(bookData.estSalesRev))));
    $('#singleResult6').html(bookData.numberOfReviews);
    var sumRank=0;
    var points = bookData.salesRankData.length;
    for(var j=0; j<points;j++){
        sumRank = sumRank + parseInt(bookData.salesRankData[j].salesRank);
    }
    var avgSalesRank = sumRank/points;
    var bookPageParser = new BookPageParser(bookData.url);
    var estSale = bookPageParser.GetEstSale(avgSalesRank);
    var realPrice = parseFloat(bookData.price.replace(/[^0-9\.]/g, ''));
    var SalesRecv = bookPageParser.GetSalesRecv(estSale, realPrice);
    var EstDailyRev = Math.round((SalesRecv/30)*100)/100;//30days

    $('#days').html(points);
    $('#AvgSalesRank').html(addCommas(avgSalesRank.toFixed(2)));
    $('#EstDailyRev').html(SiteParser.FormatPrice(addCommas(EstDailyRev)));
    $('#authorName').html(bookData.author);
    $('#bookImage').attr('src',bookData.image.replace('AA300', ''));

    var chartData = bookData.salesRankData;
    var labels = [];
    var data = [];
    for(var i=0;i<chartData.length;i++){
        labels.push(new Date(chartData[i].date).toDateString());
        data.push(chartData[i].salesRank);
    }

    if(labels.length === 1) labels.push('');
    if(data.length === 1) labels.push('');

    var lineChartData = {
        labels: labels,
        datasets: [
        {
        label: "Sales Rank",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: data
        }
        ]
    };

    var canvas = document.getElementById("canvas");
    if(!canvas) return;
    var context = canvas.getContext("2d");
    window.myLine = new Chart(context).Line(lineChartData, {
        bezierCurve: false
    });
}

function UpdateRateTrackingTable(){
    Storage.GetAllBooks(function(books){
        var html = "";
        for(var i=0;i<books.length;i++){
            html += "<tr>" +
                "<td >" + (i+1) + "</td>" +
                "<td style=\"width:500px;padding-right: 20px;\">" + books[i].title + "</td>" +
                "<td style=\"width:75px;padding-right: 10px;padding-left: 30px;\">" + books[i].salesRankData.length + "</td>" +
                "<td style=\"width:85px;\"><a class='RankTrackingResultSingle' href='#' bookUrl='" + books[i].url + "'>Results</a></td>" +
                "<td style=\"width:85px;\"><a class='RankTrackingRemove' href='#' bookUrl='" + books[i].url + "'>Remove</a></td>" +
            "</tr>";
        }
        $("table[name='data']").find("tbody").html(html);
        addEventListenerForSingleResultBook();

        //Remove links
        var RemoveRankTrackedBooks = document.getElementsByClassName('RankTrackingRemove');
        for(var i = 0;i<RemoveRankTrackedBooks.length; i++) {
            RemoveRankTrackedBooks[i].addEventListener("click", function () {
                Storage.RemoveBookInStorage($(this).attr('bookUrl'), function(){
                    RankTrackingListShow();
                });
            });
        }
  });
}

function InsertDatas(PageNumber)
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
        if (Math.floor(i / 20) <= PageNumber)
        {
            html += "<tr>" +
                "<td>"+(i + 1)+"</td>" +
                "<td class='wow'>" + obj[i].Title + "</td>" +
                "<td style='width:50px;'><a class='RankTrackingResultSingle' href='" + "#" + "' bookUrl='" + obj[i].Url + "'>T</a> " + " | " +
                    "<a target='_blank' href='" + obj[i].GoogleSearchUrl + "' >S</a> " + " | " +
                    "<a target='_blank' href='" + obj[i].GoogleImageSearchUrl + "' >C</a>" + "</td>" +
                "<td style='padding-left:15px; width:30px;'>" +obj[i].PrintLength + "</td>" +
                "<td style='width:30px;'>"+ obj[i].Price +"</td>" +
                "<td style='padding-left:15px; width:60px;' align='right'>" + addCommas(obj[i].EstSales) +"</td>" +
                "<td style='width:80px;'><div style='float:left'> "+ SiteParser.CurrencySign +" </div> <div style='float:right'>"+ addCommas(Math.round(obj[i].SalesRecv)) +"</div></td>" +
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

    if (bIsSellWin && PageNumber * 20 >= 20)
    {
        $('#data-body').css("overflow-y" , "scroll");
    }

    var min = (PageNumber + 1) * 20 - 19;
    var max = (PageNumber + 1) * 20;

    if (PageNumber >= 4)
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
    $('#result2').html(addCommas(Math.floor(averageSalesRank / nTotalCnt)));
    $('#result3').html(SiteParser.FormatPrice(addCommas(Math.floor(averageSalesRecv / nTotalCnt))));
    $('#result4').html(SiteParser.FormatPrice(addCommas((averagePrice/nTotalCnt).toFixed(2))));
    $('#result5').html(addCommas(Math.floor(averageReview / nTotalCnt)));
    $('#totalReSalesRecv').html(SiteParser.FormatPrice(addCommas(averageSalesRecv)));/**/
}
function addEventListenerForSingleResultBook(){
    var RankTrackingResultSingle = document.getElementsByClassName('RankTrackingResultSingle');
    for(var i = 0;i<RankTrackingResultSingle.length; i++) {
        RankTrackingResultSingle[i].addEventListener("click", function () {
            RankTrackingSingleShow($(this).attr('bookUrl'));
        });
    }
}
function ExportSellResult()
{
    var x = new Array(PageNum * 20 + 1);
    for (var i = 0; i < PageNum * 20 + 1; i++) {
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

    for(var index = 0; index < obj.length; index ++) {
        if (Math.floor(index / 20) <= (PageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = obj[index].Title;
            x[index + 1][2] = obj[index].Author;
            x[index + 1][3] = obj[index].DateOfPublication;
            x[index + 1][4] = obj[index].Price.replace(SiteParser.CurrencySign, SiteParser.CurrencySignForExport);
            x[index + 1][5] = addCommas(obj[index].EstSales);
            x[index + 1][6] = SiteParser.CurrencySignForExport + " " + addCommas(Math.round(obj[index].SalesRecv));
            x[index + 1][7] = obj[index].Reviews;
            x[index + 1][8] = obj[index].SalesRank;
			x[index + 1][9] = obj[index].PrintLength;
			x[index + 1][10] = obj[index].Url;
        }
    }

    var csvContent = "\uFEFF";
    x.forEach(function(infoArray, index){
        if (index <= obj.length)
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
    link.setAttribute("download", "bs-"+Category+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
}

function addCommas(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function SetupClickListeners(){
    var linkTitleWord = document.getElementById('TitleWordCloud');
    linkTitleWord.addEventListener('click', function() {
        WordsInfoUpdate();
        bIsSellWin = false;
    });

    var BestSellerLink = document.getElementById('BestSellerLink');
    BestSellerLink.addEventListener('click', function() {
        $('#data-body').css("overflow-y" , "auto");
        bIsSellWin = true;
        frun();
    });

    var linkRankTrackingResultList = document.getElementById('RankTrackingResultList');
    linkRankTrackingResultList.addEventListener('click', function() {
        RankTrackingListShow();
        bIsSellWin = false;
    });

    var link2 = document.getElementById('refresh');

    link2.addEventListener('click', function() {
        PageNum = 1;
        chrome.runtime.sendMessage({type: "save-PageNum", PageNum: PageNum});
        SetActivePage(PageNum);
        location.reload();
    });

}

var isStaticLinkInitialized = false;
function SetupStaticClickListeners() {
    if (isStaticLinkInitialized) return;

    var link3 = document.getElementById('PullResult');
    link3.addEventListener('click', function () {
        if (PageNum > 1) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { page: PageNum }, function (response) {
                });
            });
        }

        PageNum++;
        chrome.runtime.sendMessage({ type: "save-PageNum", PageNum: PageNum });
        SetActivePage(PageNum);
    });

    var link4 = document.getElementById('Export');
    link4.addEventListener('click', function() {
		if (bIsSellWin) ExportSellResult();
		else ExportWordCloudResult();
    });
	
    isStaticLinkInitialized = true;
}

function LoadData(obj) {
    SetupStaticClickListeners();

    if (typeof obj === undefined || obj.length < 1)
    {
        resetCss();
        $('#main-header').html('');
        $('.info.list_books').html("");
        $('.info.list_books').show();
        $('#ExportBtn').show();
        $('#NoDataFooter').show();

        $('.table-head').html("");
        $('#main-content').html("<div><img style=\"width:100%\" src=\"loading.gif\"//></div>");
        $('#main-content').show();
        $('#main-header').show();

        setTimeout(UpdateTable.bind(null,obj), 6000);
    }else{
        UpdateTable(obj);
    }
}
function UpdateTable(obj)
{
    if (typeof obj === undefined || obj.length < 1)
    {
        resetCss();
        $('#main-header').html('');
        $('.info.list_books').html('');
        $('.info.list_books').show();
        $('.table-head').html('');
        $('#no-data-found-content').show();
        $('#NoDataFooter').show();
        $('#ExportBtn').show();

        LoadAdvertisementBanner();

        var link2 = document.getElementById('ClickHere');
        link2.addEventListener('click', function() {
            chrome.runtime.sendMessage({type: "get-current-Tab"}, function(response) {
                chrome.tabs.update(response.ID, {url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html"});
                window.close();
            });
        });

		var link5 = document.getElementById('refresh');
		link5.addEventListener('click', function() {
			frun();
		});

        IsErrorWindow = true;
        return;
    }

    IsErrorWindow = false;
    Storage.GetNumberOfBooks(function(num){
        var HeaderHtml = "<div style=\"float:left;font-size:14px;padding-left:11px;\" id=\"CategoryKind\">Best Sellers in</div><div style=\"float:left;font-size:14px;padding-left:6px;font-weight:bold\" id=\"title\">Kindle eBooks:</div><div style=\"float:right\"><a id=\"BestSellerLink\" href=\"#\">Best Seller Rankings</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a id=\"TitleWordCloud\" href=\"#\">Titles: Word Cloud (20)</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a id=\"RankTrackingResultList\" href=\"#\">Rank Tracking (" + num + ")</a></div>";
        $('#main-header').html(HeaderHtml);
        SetupClickListeners();
    });

	var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:175px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"searchf\" style=\"padding-right:25px;\">More</label><label class=\"sort-column\" id=\"pageno\" style=\"padding-right:8px;\">Page(s)</label><label class=\"sort-column\" id=\"price\" style=\"padding-right:30px;\">Price</label><label class=\"sort-column\" id=\"est-sales\" style=\"padding-right:20px;\" >Est. Sales</label><label class=\"sort-column\" id=\"sales-rev\" style=\"padding-right:15px;\" >Sales Rev.</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:10px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" >Sales Rank</label>"
    var InfoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">2,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rev:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">$7,000.00</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. No. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";

    resetCss();
    $('#main-content').html(ContentHtml);
    $('.info.list_books').html(InfoHtml);
    $('#main-content').show();
    $('#main-header').show();
    $('#BestSellersRankingFooter').show();
    $('#ExportBtn').show();
    $('.info.list_books').show();

    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y" , "hidden");
    $('.table-head').html(tableHead);
    $('.table-head').css("background-color" , "#333333");

    $('.sort-column').each(function( index ){
        $(this).click(function() {
            var newSortColumn = $(this).attr('id');
            currentSortDirection *= -1;

            if(currentSortColumn != newSortColumn)
                currentSortDirection = 1;

            currentSortColumn = newSortColumn;
        });
    });

    $('#TitleWordCloud').text("Titles: Word Cloud (20)");
    InsertDatas(0);
}

function SetActivePage(pageNum)
{
    $('#TitleWordCloud').text("Titles: Word Cloud (" + (pageNum) * 20 + ")");
    InsertDatas(pageNum-1);
}

function frun()
{

    chrome.runtime.sendMessage({type: "get-current-Tab"}, function(response) {
        if (response.URL.indexOf("http://www.amazon.") < 0) //Go To Amazone Page
        {
            chrome.tabs.create({url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html", active:true});
            window.close();
            return;
        }
        else
        {   /////////////////////load//////////////////////////
            CurrentPageUrl = response.URL;
            SiteParser = GetSiteParser(CurrentPageUrl);
            chrome.runtime.sendMessage({type: "save-UrlParams", MainUrl: SiteParser.MainUrl, ParamUrlBestSellers: SiteParser.ParamUrlBestSellers});
            InitRegionSelector();
            LoadInfos();
        }
    });
}

function compare(a,b) {
    var func = columnGetterFunctions[currentSortColumn];
    if (func(a) < func(b))
        return -1 * currentSortDirection;
    if (func(a) > func(b))
        return 1 * currentSortDirection;
    return 0;
}

var isRefreshStarted = false;
function LoadInfos()
{
    var url = CurrentPageUrl;
    var IsFreeUrl = false;
    var currentUrl = url;

    if (currentUrl.indexOf("ref=zg_bs_fvp_p_f") >= 0 || currentUrl.indexOf("&tf=") >= 0)
        IsFreeUrl = true;

    if(url.indexOf("/s/")>=0)
    {
       currentUrl = url.replace(/\&page=[0-9]+/, "");	
    }
    else if (url.indexOf("/ref=") >= 0)
    {
        var _Pos = url.lastIndexOf('/ref=');
        currentUrl = url.substr(0, _Pos);
    }
    
    chrome.runtime.sendMessage({type: "get-settings"}, function(response) {
        settings = response.settings;

        var settingLen = settings.Book.length;
        while(obj.length > 0) {
            obj.pop();
        }

        PageNum = settings.PageNum;
        for (var i = 0; i < settingLen; i++)
        {
            if (settings.Book[i].ParentUrl === currentUrl)
            {
                if (IsFreeUrl)
                {
                    if (settings.Book[i].Price.indexOf("Free") >= 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl};
                        obj.push(settingTmp);
                    }
                }
                else
                {
                    if (settings.Book[i].Price.indexOf("Free") < 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl};
                        obj.push(settingTmp);
                    }
                }
            }
        }

        obj.sort(compare);
        LoadData(obj);
        LoadAdvertisementBanner();
    });

    if (!isRefreshStarted) {
        setTimeout(AutoAddFunc, 1000);
        isRefreshStarted = true;
    }
}

function InitRegionSelector(){
    $("#regionSelector").val(SiteParser.Region);
    $("#regionSelector").change(function() {
        var url;
        switch ($("#regionSelector").val()){
            case AmazonComParser.Region:
                url = "http://www.amazon.com/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/154606011/ref=zg_bs_nav_kstore_1_kstore";
                break;
            case AmazonCoUkParser.Region:
                url = "http://www.amazon.co.uk/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/341689031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonDeParser.Region:
                url = "http://www.amazon.de/gp/bestsellers/digital-text/530886031/ref=zg_bs_nav_kinc_1_kinc";
                break;
        }

        chrome.tabs.create({url: url, active:true});
    });
}

function LoadAdvertisementBanner()
{
    $.get("http://www.kdspy.com/banner.html", function(data) {
        $("#ad").html(data);
    });
}

chrome.runtime.sendMessage({type: "set-current-Tab"}, function(response) {
    setTimeout(frun, 100);
});
