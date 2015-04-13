/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function RankTrackingTab(){
    if ( RankTrackingTab.prototype._singletonInstance )
        return RankTrackingTab.prototype._singletonInstance;
    RankTrackingTab.prototype._singletonInstance = this;

    this.pageNum = 1;
}

RankTrackingTab.prototype.ExportToCsv = function(bookData){
    var bookUrl = $('#ExportBtnWordCloud').attr('book-url');

    new BookStorage().getBook(bookUrl, function(bookData) {
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

            var csvContent = "\uFEFF";
            x.forEach(function(infoArray, index){
                if (index <= bookData.salesRankData.length)
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
            link.setAttribute("download", "rs-" + bookData.title + "-" + mm + "-" + dd + "-" + yyyy + ".csv");
            link.click();
        }
    });
};
