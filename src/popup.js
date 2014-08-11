var Category;
var obj = [];
var clouds = [];
var PageNum = 1;
var CurrentPageUrl = "";
var refresed = false;
var bIsSellWin = true;
var IsErrorWindow = false;
var columnGetterFunctions = new Array();
columnGetterFunctions['no'] = function(a){return parseInt(a.No)}
columnGetterFunctions['pageno'] = function(a){
    var printLength = parseInt(a.PrintLength);
    return isNaN(printLength) ? 0 : printLength;
}
columnGetterFunctions['title-book'] = function(a){return a.Title}
columnGetterFunctions['price'] = function(a){return parseFloat(a.Price.substr(1))}
columnGetterFunctions['est-sales'] = function(a){return a.EstSales}
columnGetterFunctions['sales-rev'] = function(a){return a.SalesRecv}
columnGetterFunctions['reviews'] = function(a){return parseInt(a.Reviews.replace(/,/g,''))}
columnGetterFunctions['sales-rank'] = function(a){return parseInt(a.SalesRank.replace(/,/g,''))}

var currentSortColumn = 'no';
var currentSortDirection = 1; //1 = ask, -1 = desc

var bDebug = false;

var currency = "$";

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
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author };
                        obj.push(settingTmp);
                    }
                }
                else
                {
                    if (settings.Book[i].Price.indexOf("Free") < 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author};
                        obj.push(settingTmp);
                    }
                }
            }
            else
            {
            }
        }



        obj.sort(compare);

        if (IsErrorWindow && obj.length > 0)
        {
            frun();
        }
        else if (!refresed && bIsSellWin)
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

    if (!refresed)
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

function changeSwitchColor(color)
{
    $('div.switch').css("background-color", color);
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
    //for(var index = 0; index < clouds.length ; index ++) {

        {
            x[nArrayIndex][0] = clouds[index].Word;
            x[nArrayIndex][1] = clouds[index].Len.toString();
            nArrayIndex++;
        }
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
    var xPathRes = document.evaluate ( "/html/body/div/div/div/table/tbody/tr/td[2]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
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

    $('.info').html(InfoHtml);
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

    $('.content').html(contentHtml);

    var footerHtml = "<div style=\"float: left;width: 62%;margin-top: 5px;padding-left: 20px;\"><div style=\"margin: 0 auto;text-align: left;padding-top: 5px;\"><span style=\"font-size:12px\">Top 5 Words Used in Best Seller Titles:</span></div><br>"

    nCnt = 1;
    for (var i = clouds.length - 1; i >= 0; i--)
    {
        if (clouds[i].Word.length > 2)
        {
            footerHtml += (nCnt + ". <b style='padding-right : 15px;'>" + clouds[i].Word + "</b>&nbsp;&nbsp;&nbsp;&nbsp;");
            if (nCnt >= 5)
                break;

            nCnt++;

        }
    }



    footerHtml += "</div><div style=\"float:left;width:10%;\"><div style=\"display:table;text-align:center;margin: 0 auto;border-left : 1px solid 999999; border-right : 1px solid 999999; padding:0 18px;\"><div style=\"font-size:11px; margin-top: 10px\">Export</div><div style=\"font-size:16px;font-weight:bold\"><img src=\"../icons/download.png\" id=\"Export\" style=\"zoom: .8\"></div></div></div><div style=\"margin: 0 auto;display: table;text-align: center;padding-left: 0px;padding-top: 5px;\"><div id=\"ad\"/></div></div>";

    $('.table-head').html("");
    $('.content').css("overflow" , "auto");

    $('.content').css("width" , "97%");
    $('.content').css("height" , "380px");
    $('.content').css("display" , "block");
    $('.content').css("max-height" , "380px");
    $('.content').css("min-height" , "380px");
    $('.content').css("margin-top" , "-25px");
    $('.content').css("margin-left" , "21px");
    $('.content').css("line-height" , "55px");

    $('.footer').html(footerHtml);

    LoadAdvertisementBanner();

    chrome.runtime.sendMessage({type: "get-settings"}, function(response)
    {
        var setting = response.settings;
        $("input[name='checkbox']").attr('checked', setting.PullStatus);

        if($("input[name='checkbox']").prop('checked'))
        {
            setTimeout(changeSwitchColor.bind(null, "#009900"), 300);
        }
        else
        {
            setTimeout(changeSwitchColor.bind(null, "#ff0000"), 300);
        }
    });



    $("input[name='checkbox']").click(function() {
        if($("input[name='checkbox']").prop('checked'))
        {
            setTimeout(changeSwitchColor.bind(null, "#009900"), 300);
            chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: true}, function(response){
            });

        }
        else
        {
            setTimeout(changeSwitchColor.bind(null, "#ff0000"), 300);
            chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false}, function(response){
            });

        }
    });

    var link4 = document.getElementById('Export');

    link4.addEventListener('click', function() {
        ExportWordCloudResult();
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
                "<td style='width:50px;'>" +obj[i].PrintLength + "</td>" +
                "<td style='width:30px;'>"+ obj[i].Price +"</td>" +
                "<td style='width:60px;' align='right'>" + addCommas(obj[i].EstSales) +"</td>" +
                "<td style='width:80px;'><div style='float:left'> "+ currency +" </div> <div style='float:right'>"+ addCommas(Math.round(obj[i].SalesRecv)) +"</div></td>" +

                "<td style='width:50px;' align='right'>"+ obj[i].Reviews +"</td>" +
                "<td style='width:80px;padding-right : 10px;' align='right'>"+ obj[i].SalesRank +"</td>"+
                "</tr>";


            var price = "" + obj[i].Price;
            var review = "" + obj[i].Reviews;

            {
                averageSalesRank += parseInt(obj[i].SalesRank.replace(",", "").trim());
                averageSalesRecv += parseInt(obj[i].SalesRecv);
                if (price.indexOf("Free") >= 0)
                    averagePrice = 0;
                else
                    averagePrice += parseFloat(price.substr(1).replace(",", "").trim());

                //if(typeof review !== "undefined")
                averageReview += parseInt(review.replace(",", "").trim());

                nTotalCnt ++;
            }

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

    //$(".data").tablePagination();

    if (categoryKind.indexOf("Seller") >= 0)
        $("#CategoryKind").html("Best Sellers in");
    else if(categoryKind.indexOf("Search")>=0) 
	$("#CategoryKind").html("Search Results");
    else
        $("#CategoryKind").html("Author Status");

    $("#title").html(category + ":");
    $('#result2').html(addCommas(Math.floor(averageSalesRank / nTotalCnt)));
    //$('#result2').html("aaaaaaaaaaa");

    $('#result3').html(currency + " " + addCommas(Math.floor(averageSalesRecv / nTotalCnt)));
    $('#result4').html(currency + " " +  addCommas((averagePrice/nTotalCnt).toFixed(2)));
    $('#result5').html(addCommas(Math.floor(averageReview / nTotalCnt)));
    $('#totalReSalesRecv').html(currency + " " + addCommas(averageSalesRecv));/**/


}

function ExportSellResult()
{
    var x = new Array(PageNum * 20 + 1);

    for (var i = 0; i < PageNum * 20 + 1; i++) {
        x[i] = new Array(7);
    }

    x[0][0] = "#";
    x[0][1] = "Kindle Book Title";
    x[0][2] = "Author";
    x[0][3] = "Price";
    x[0][4] = "Est. Sales";
    x[0][5] = "Sales Rev.";
    x[0][6] = "Reviews";
    x[0][7] = "Sales Rank";
	x[0][8] = "Page No(s)";
	x[0][9] = "Book URL";

    for(var index = 0; index < obj.length; index ++) {

        if (Math.floor(index / 20) <= (PageNum - 1))
        {
            x[index + 1][0] = (index + 1).toString();
            x[index + 1][1] = obj[index].Title;
            x[index + 1][2] = obj[index].Author;
            x[index + 1][3] = obj[index].Price;
            x[index + 1][4] = addCommas(obj[index].EstSales);
            x[index + 1][5] = currency+ " " + addCommas(Math.round(obj[index].SalesRecv));
            x[index + 1][6] = obj[index].Reviews;
            x[index + 1][7] = obj[index].SalesRank;
			x[index + 1][8] = obj[index].PrintLength;
			//x[index + 1][8] =  "=HYPERLINK(" + obj[index].Url + ")";
			x[index + 1][9] = obj[index].Url;
        }
    }

    //var csvContent = "data:text/csv;charset=utf-8,";
    var csvContent = "";
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

				if(i == 9 && index > 0)
					fieldValue =  "=HYPERLINK(\"" + fieldValue + "\")";
                dataString[i] = (quotesRequired || escapeQuotes ? "\"" : "") + fieldValue + (quotesRequired || escapeQuotes ? "\"" : "") + ((i < (infoArray.length-1)) ? "," : "\r\n");
            }
            for (var i = 0; i < dataString.length; i ++)
                csvContent += dataString[i];
        }
    });

    var blob = new Blob([csvContent], {type : 'text/csv', charset : 'utf-8', encoding:'utf-8'});
    var url = URL.createObjectURL(blob);

    //var encodedUri = encodeURI(csvContent);
    /*window.open(encodedUri);*/

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
function LoadData(obj){
    if (typeof obj === undefined || obj.length < 1)
    {
        $('.header').html("");
        $('.info').html("");
        $('.table-head').html("");
        $('.content').html("<div><img style=\"width:100%\" src=\"loading.gif\"//></div>");
        $('.footer').html("<div style=\"float:left;width:25%;margin-top: 22px;\"><div style=\"margin: 0 auto;display: table;text-align: center;\"></div></div><div style=\"float:left;width:40%;margin-top: 13px;\"><div style=\"margin: 0 auto;display: table;text-align: center;padding-top: 5px;\"><span style=\"font-size:12px\"></span><div style=\"font-size:16px;font-weight:bold\" ></div></div></div><div style=\"float:left;width:10%;\"><div style=\"display:table;text-align:center;margin:0 auto;border-left : 1px solid 999999; border-right : 1px solid 999999; padding:0 18px;\"><div style=\"font-size:11px; margin-top: 10px\">Reset</div><div style=\"font-size:16px;font-weight:bold\"><img src=\"../icons/refresh.png\" id=\"refresh\" style=\"zoom: .8\"></div></div></div><div style=\"float:left;width:25%;\"><div style=\"margin: 0 auto;display: table;text-align: center;padding-left: 0px;padding-top: 5px;\"><div id=\"ad\"/></div></div>");
        setTimeout(UpdateTable.bind(null,obj), 6000);
    }else{
        UpdateTable(obj);
    }
}
function UpdateTable(obj)
{
    if (typeof obj === undefined || obj.length < 1)
    {
        $('.header').html("");
        $('.info').html("");
        $('.table-head').html("");
        $('.content').html("<div><div style=\"width:72%; margin:0 auto;line-height:25px;font-size:18px;\"><b style=\"font-size:26px;margin-left: 150px;\">No Data Can Be Found!</b><br><br>KindleSpy can only pull data from Category pages, author pages & search results pages on the Kindle Store.<br><br>Results are only supported from Amazon US and UK. <br> <br>If you have continued problems, please see our troubleshooting section <a href=\"http://www.kdspy.com/members/kindlespy/troubleshooting/\" style=\"color: 0000c0;font-size:20px;font-weight:bold\" id=\"ClickHere\">here</a>.<br> <br> <b>>> </b>For the Kindle Bestsellers, click here for <a href=\"http://www.kdspy.com/u/amazonkindle\" target=\"_blank\" style=\"color: 0000c0;font-size:20px;font-weight:bold\" id=\"ClickHere\">US</a> or <a href=\"http://www.kdspy.com/u/amazonkindleuk\" target=\"_blank\" style=\"color: 0000c0;font-size:20px;font-weight:bold\" id=\"ClickHere\">UK</a> categories.  </div>  </div>");
        $('.footer').html("<div style=\"float:left;width:25%;margin-top: 22px;\"><div style=\"margin: 0 auto;display: table;text-align: center;\"></div></div><div style=\"float:left;width:40%;margin-top: 13px;\"><div style=\"margin: 0 auto;display: table;text-align: center;padding-top: 5px;\"><span style=\"font-size:12px\"></span><div style=\"font-size:16px;font-weight:bold\" id=\"totalReSalesRecv\"></div></div></div><div style=\"float:left;width:10%;\"><div style=\"display:table;text-align:center;margin:0 auto;border-left : 1px solid 999999; border-right : 1px solid 999999; padding:0 18px;\"><div style=\"font-size:11px; margin-top: 10px\">Reset</div><div style=\"font-size:16px;font-weight:bold\"><img src=\"../icons/refresh.png\" id=\"refresh\" style=\"zoom: .8\"></div></div></div><div style=\"float:left;width:25%;\"><div style=\"margin: 0 auto;display: table;text-align: center;padding-left: 0px;padding-top: 5px;\"><div id=\"ad\"/></div></div>");

        LoadAdvertisementBanner();

        $('#data-body').css("overflow-y" , "scroll");
        $('.content').css("overflow" , "inherit");
        $('.content').css("width" , "99%");
        $('.content').css("height" , "340px");
        $('.content').css("display" , "block");
        $('.content').css("max-height" , "340px");
        //$('.content').css("min-height" , "340px");
        $('.content').css("margin-left" , "0px");
        $('.content').css("margin-top" , "0px");
        $('.content').css("margin:" , "0 auto");
        $('.content').css("line-height" , "55px");

        chrome.runtime.sendMessage({type: "get-settings"}, function(response)
        {
            var setting = response.settings;
            $("input[name='checkbox']").attr('checked', setting.PullStatus);

            if($("input[name='checkbox']").prop('checked'))
            {
                setTimeout(changeSwitchColor.bind(null, "#009900"), 300);
            }
            else
            {
                setTimeout(changeSwitchColor.bind(null, "#ff0000"), 300);
            }
        });


        $("input[name='checkbox']").click(function() {
            //alert("aaaaaaaaaaaaaa");
            //$("input[name='checkbox']").css("checked", true);
            if($("input[name='checkbox']").prop('checked'))
            {
                setTimeout(changeSwitchColor.bind(null, "#009900"), 300);
                chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: true}, function(response){
                });
            }
            else
            {
                setTimeout(changeSwitchColor.bind(null, "#ff0000"), 300);
                chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false}, function(response){
                });
            }
        });


        var link2 = document.getElementById('ClickHere');
        link2.addEventListener('click', function() {
            chrome.runtime.sendMessage({type: "get-current-Tab"}, function(response) {
                chrome.tabs.update(response.ID, {url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html"});
                window.close();
                return;
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

    //var ContentHtml = "<table class=\"data\" name=\"data\"><thead><th style=\"text-align:right;padding-right: 4px;\">#</th><th>Kindle Book Title</th><th>Price</th><th>Est.Sales</th><th>Sales Rev.</th><th>Reviews</th><th>Sales Rank</th><th style=\"width:10px\">&nbsp;</th></thead><tbody></tbody></table>";
	var HeaderHtml = "<div style=\"float:left;font-size:14px;padding-left:11px;\" id=\"CategoryKind\">Best Sellers in</div><div style=\"float:left;font-size:14px;padding-left:6px;font-weight:bold\" id=\"title\">Kindle eBooks:</div><div style=\"float:right\"><a id=\"BestSellerLink\" href=\"#\">Best Seller Rankings</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a id=\"TitleWordCloud\" href=\"#\">Titles: Word Cloud (20)</a></div>";
	var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:205px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"pageno\" style=\"padding-right:20px;\">Page No(s)</label><label class=\"sort-column\" id=\"price\" style=\"padding-right:30px;\">Price</label><label class=\"sort-column\" id=\"est-sales\" style=\"padding-right:20px;\" >Est. Sales</label><label class=\"sort-column\" id=\"sales-rev\" style=\"padding-right:15px;\" >Sales Rev.</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:10px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" >Sales Rank</label>"
    var InfoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">2,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rev:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">$7,000.00</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. No. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";
    var footerHtml = "<div style=\"float:left;width:25%;margin-top: 22px;\"><div style=\"/*margin: 0 auto;*/display: table;text-align: center;\"><a href=\"#\" style=\"margin-left: 29px;\" id=\"PullResult\">Pull Results 1-20</a></div></div><div style=\"float:left;width:30%;margin-top: 10px;\"><div style=\"margin: 0 auto;display: table;text-align: center;padding-top: 5px;\"><span style=\"font-size:11px\">Total Sales Revenue:</span><div style=\"font-size:16px;font-weight:bold\" id=\"totalReSalesRecv\">$97,000.00</div></div></div><div style=\"float:left;width:10%;\"><div style=\"display:table;text-align:center;margin:0 auto;border-left : 1px solid 999999; border-right : 1px solid 999999; padding:0 18px;\"><div style=\"font-size:11px; margin-top: 10px\">Reset</div><div style=\"font-size:16px;font-weight:bold\"><img src=\"../icons/refresh.png\" id=\"refresh\" style=\"zoom: .8\"></div></div></div><div style=\"float:left;width:10%;\"><div style=\"display:table;text-align:center;margin:0 auto;border-left : 0px solid black; border-right : 1px solid 999999; padding:0 18px;\"><div style=\"font-size:11px; margin-top: 10px\">Export</div><div style=\"font-size:16px;font-weight:bold\"><img src=\"../icons/download.png\" id=\"Export\" style=\"zoom: .8\"></div></div></div><div style=\"float:left;width:25%;\"><div style=\"margin: 0 auto;display: table;text-align: center;padding-left: 0px;padding-top: 5px;\"><div id=\"ad\"/></div></div>";
    //if($(".content").hasClass("border"))$(".content").removeClass("border");
	$('.header').html(HeaderHtml);
    $('.content').html(ContentHtml);
    $('.info').html(InfoHtml);
    $('.footer').html(footerHtml);
    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y" , "hidden");
    $('.table-head').html(tableHead);
    $('.table-head').css("background-color" , "#333333");

    $('.content').css("overflow" , "auto");
    $('.content').css("width" , "99%");
    $('.content').css("height" , "340px");
    $('.content').css("display" , "block");
    $('.content').css("max-height" , "340px");
    $('.content').css("min-height" , "340px");
    $('.content').css("margin-left" , "0px");
    $('.content').css("margin-top" , "0px");
    $('.content').css("margin:" , "0 auto");
    $('.content').css("line-height:" , "55px");

    chrome.runtime.sendMessage({type: "get-settings"}, function(response)
    {
         var setting = response.settings;
         $("input[name='checkbox']").attr('checked', setting.PullStatus);
        if($("input[name='checkbox']").prop('checked'))
        {
            setTimeout(changeSwitchColor.bind(null, "#009900"), 300);
        }
        else
        {
            setTimeout(changeSwitchColor.bind(null, "#ff0000"), 300);
        }
    });


    $("input[name='checkbox']").click(function() {
        if($("input[name='checkbox']").prop('checked'))
        {
            setTimeout(changeSwitchColor.bind(null, "#009900"), 300);
         chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: true}, function(response){
         });
        }
        else
        {
            setTimeout(changeSwitchColor.bind(null, "#ff0000"), 300);
            chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false}, function(response){
            });
        }
    });

	var linkTitleWord = document.getElementById('TitleWordCloud');
    // onClick's logic below:
    linkTitleWord.addEventListener('click', function() {
        //alert("aaaaaaaa");
        WordsInfoUpdate();
        bIsSellWin = false;

    });

    var BestSellerLink = document.getElementById('BestSellerLink');
    // onClick's logic below:
    BestSellerLink.addEventListener('click', function() {
        $('#data-body').css("overflow-y" , "auto");
        bIsSellWin = true;
        frun();
    });

    var link2 = document.getElementById('refresh');

    link2.addEventListener('click', function() {
        //refresed = true;
        //frun();
        PageNum = 1;
        chrome.runtime.sendMessage({type: "save-PageNum", PageNum: PageNum});
        SetActivePage(PageNum);
        location.reload();
    });

    var link3 = document.getElementById('PullResult');

    link3.addEventListener('click', function(){
        if(PageNum>1){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {page: PageNum}, function(response) {
                });
            });

        }

        PageNum++;
        chrome.runtime.sendMessage({type: "save-PageNum", PageNum: PageNum});

        SetActivePage(PageNum);
    });

    var link4 = document.getElementById('Export');

    link4.addEventListener('click', function() {
        ExportSellResult();
    });
   $('.sort-column').each(function( index ){
       $(this).click(function() {
           newSortColumn = $(this).attr('id');
           currentSortDirection *= -1;

           if(currentSortColumn != newSortColumn)
               currentSortDirection = 1;

           currentSortColumn = newSortColumn;
       });
   })

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

        if (response.URL.indexOf("http://www.amazon.co") < 0) //Go To Amazone Page
        {
            //chrome.tabs.update(response.ID, {url: "http://www.amazon.com/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/154606011/ref=zg_bs_nav_kstore_1_kstore"});
            chrome.tabs.create({url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html", active:true});
            window.close();
            return;
        }

        else
        {   /////////////////////load//////////////////////////
            CurrentPageUrl = response.URL;
            var mainUrl =  "http://" + CurrentPageUrl.split('/')[2];
            var paramUrlBestSellers = null;
            if (mainUrl.indexOf("www.amazon.com")!=-1){
                paramUrlBestSellers = "154606011";
                currency = "$";
            }else if(mainUrl.indexOf("www.amazon.co.uk")!=-1){
                paramUrlBestSellers = "341689031";
                currency = "&pound;";
            }
            chrome.runtime.sendMessage({type: "save-UrlParams", MainUrl: mainUrl, ParamUrlBestSellers:paramUrlBestSellers});
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
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author};
                        obj.push(settingTmp);
                    }
                }
                else
                {
                    if (settings.Book[i].Price.indexOf("Free") < 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author};
                        obj.push(settingTmp);
                    }
                }
            }
            else
            {
            }
        }


        obj.sort(compare);
        LoadData(obj);
        LoadAdvertisementBanner();
    });

    if (!refresed)
        setTimeout(AutoAddFunc, 1000);
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
//ToDo with this smth
function getCurrencyReplace(){
    return(currency!="$")?"\u00A3":currency;
}