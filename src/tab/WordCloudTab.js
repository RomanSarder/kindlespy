/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function WordCloudTab(){
    if ( WordCloudTab.prototype._singletonInstance )
        return WordCloudTab.prototype._singletonInstance;
    WordCloudTab.prototype._singletonInstance = this;

    this.PageNum = 1;
}

WordCloudTab.prototype.ExportToCsv = function(data){
    var cloudData = data.cloudData;
    var x = new Array(cloudData.length + 1);

    for (var i = 0; i < cloudData.length + 1; i++) {
        x[i] = new Array(2);
    }

    x[0][0] = "Words";
    x[0][1] = "Count";

    var nArrayIndex = 1;
    for(var index = cloudData.length-1; index >= 0 ; index --) {
        x[nArrayIndex][0] = cloudData[index].Word;
        x[nArrayIndex][1] = cloudData[index].Len.toString();
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
    link.setAttribute("download", "wc-"+GetCategoryFromBookData(data.bookData)+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
};
