/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function RankTrackingTab(siteParser){
    if ( RankTrackingTab.prototype._singletonInstance )
        return RankTrackingTab.prototype._singletonInstance;
    RankTrackingTab.prototype._singletonInstance = this;

    this.storage = new BookStorage();
    this.siteParser = siteParser;
}

RankTrackingTab.prevBookUrl = '';

RankTrackingTab.initUI = function(bookUrl){
    resetCss();
    RankTrackingTab.resetTrackingBookPage(bookUrl);
    $('#tracking-header').show();
    $('#tracking-content').show();
    $('#TrackedPanelFooter').show();
    $('.info.single_book').show();
    $('.right-panel').show();
    $('.table-head').show();
    $(".table-head").html("<label>Bestseller rank tracking(30 days)<label>");

    LoadAdvertisementBanner();

    $('.left-panel').css("width", "525px");

    $('#main-header').html('');
    $('#tracking-content').html('');
};

RankTrackingTab.resetTrackingBookPage = function(bookUrl) {
    if(RankTrackingTab.prevBookUrl === bookUrl) return;
    RankTrackingTab.prevBookUrl = bookUrl;
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
    $('#BookTracked').hide();
    $('#ExportBtn').hide();
    $('#ExportBtnWordCloud').show();
    $('#ExportBtnWordCloud').attr('book-url','');
};

RankTrackingTab.addEventListenerForSingleResultBook = function(rankTrackingTab){
    $('table[name="data"] tbody').on('click', '.RankTrackingResultSingle', function(){
        RankTrackingTab.initUI($(this).attr('bookUrl'));
        rankTrackingTab.loadDetails($(this).attr('bookUrl'));
    });
};

RankTrackingTab.prototype.exportToCsv = function(bookData){
    var bookUrl = $('#ExportBtnWordCloud').attr('book-url');

    this.storage.getBook(bookUrl, function(bookData) {
        if(bookData) {
            var x = new Array(bookData.salesRankData.length+1);

            for (var i = 0; i < bookData.salesRankData.length+1; i++) {
                x[i] = new Array(2);
            }

            x[0][0] = "Date";
            x[0][1] = "Sales Rank";

            for(var index = 0; index < bookData.salesRankData.length; index ++) {
                x[index + 1][0] = new Date(bookData.salesRankData[index].date).toDateString();
                x[index + 1][1] = Helper.addCommas(bookData.salesRankData[index].salesRank);
            }

            var fileName = "rs-" + bookData.title;
            Export.exportData(x, fileName, bookData.salesRankData.length + 1);
        }
    });
};

RankTrackingTab.prototype.load = function(){
    var contentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:350px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"daysTracked\" style=\"padding-right:30px;\">Days Tracked</label><label class=\"sort-column\" id=\"resTracking\" style=\"padding-right:45px;\">Tracking</label><label class=\"sort-column\" id=\"removeTracking\" style=\"padding-right:5px;\">Action</label>";
    var info = "<div style=\"font-size:15px;\"><b>Best Seller Rank Tracking:</b></div>";

    return { info: info, content: contentHtml, header: tableHead };
};

RankTrackingTab.prototype.loadDetails = function(bookUrl){
    var _this = this;
    $('#LinkBackTo').hide();
    _this.storage.getBook(bookUrl, function(bookData) {
        if(bookData) {
            _this.updateTrackedBookView(bookData);
            return;
        }

        _this.storage.initBookFromUrl(bookUrl, function(bookFromUrl){
            _this.updateTrackedBookView(bookFromUrl);
        });
    });
};

RankTrackingTab.prototype.updateRateTrackingTable = function(){
    var _this = this;
    _this.storage.getAllBooks(function(books){
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
        $('table[name="data"] tbody').html(html);
        RankTrackingTab.addEventListenerForSingleResultBook(_this);

        //Remove links
        var RemoveRankTrackedBooks = $('.RankTrackingRemove');
        for(var i = 0;i<RemoveRankTrackedBooks.length; i++) {
            $(RemoveRankTrackedBooks[i]).click(function () {
                _this.storage.removeBookInStorage($(this).attr('bookUrl'), function(){
                    _this.updateRateTrackingTable();
                });
            });
        }
    });
};

RankTrackingTab.prototype.updateTrackedBookView = function(bookData){
    var contentHtml = '';
    $('#bookTitle').text(bookData.title);
    if(bookData.trackingEnabled){
        contentHtml = '<div><canvas id="canvas" height="290" width="520"></canvas></div>';
        $('#infoPages').show();
        $('.info.single_book .info-item').css('width', '16%');
        $('#ExportBtnWordCloud').show();
        $('#BookTracked').show();
    }
    else {
        contentHtml = '<div class="brtdisable"><div>Bestseller Rank Tracking</div><div>Currently Disabled</div></div>';
        $('#enableTracking').prop('disabled', false);
    }
    $('#tracking-header').show();
    $('#LinkBackTo').show();
    $('#ExportBtnWordCloud').show();
    $('#AdPanel').show();
    $('#tracking-content').html(contentHtml);
    $('#enableTracking').toggle(!bookData.trackingEnabled);
    $('#disableTracking').toggle(bookData.trackingEnabled);
    $('#enableTracking').data({url: bookData.url});
    $('#disableTracking').data({url: bookData.url});

    $('#singleResult1').html(bookData.currentSalesRank);
    $('#singleResult2').html(bookData.price);
    $('#singleResult3').html(bookData.pages);
    $('#singleResult4').html(Helper.addCommas(bookData.estSales));
    $('#singleResult5').html(this.siteParser.formatPrice(Helper.addCommas(Math.round(bookData.estSalesRev))));
    $('#singleResult6').html(bookData.numberOfReviews);
    var sumRank=0;
    var points = bookData.salesRankData.length;
    for(var j=0; j<points;j++){
        sumRank += Helper.parseInt(bookData.salesRankData[j].salesRank, this.siteParser.decimalSeparator);
    }
    var avgSalesRank = sumRank/points;
    var bookPageParser = new BookPageParser(bookData.url);
    var estSale = bookPageParser.getEstSale(avgSalesRank);
    var realPrice = Helper.parseFloat(bookData.price, this.siteParser.decimalSeparator);
    var SalesRecv = bookPageParser.getSalesRecv(estSale, realPrice);
    var EstDailyRev = Math.floor((SalesRecv/30)*100)/100;//30days

    $('#days').html(points);
    $('#AvgSalesRank').html(Helper.addCommas(Math.floor(avgSalesRank)));
    $('#EstDailyRev').html(this.siteParser.formatPrice(Helper.addCommas(EstDailyRev)));
    $('#authorName').html(bookData.author);
    $('#bookImage').attr('src',bookData.image.replace('AA300', '').replace('AA324', '').replace('AA278', ''));
    $('#ExportBtnWordCloud').attr('book-url', bookData.url);

    var chartData = bookData.salesRankData;
    var labels = [];
    var data = [];
    for(var i=0;i<chartData.length;i++){
        labels.push(new Date(chartData[i].date).toDateString());
        data.push(chartData[i].salesRank.replace(/[^0-9\.]/g, ''));
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
};
