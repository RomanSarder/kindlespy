/**
 * Created by Andrey Klochkov on 09.08.14.
 */

/**
 * Parses URL and returns a get parameter requested
 * @param url url to parse
 * @param name parameter name
 * @returns {string} parameter value
  */
function GetParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**
 * Returns default value if parameter is not passed to function, otherwise returns it's value.
 * @param param parameter
 * @param defaultValue default param value
 * @returns default value if parameter is not set
  */
function ValueOrDefault(param, defaultValue){
    return typeof param === "undefined" ? defaultValue : param;
}

/**
 * Returns substring between startChar and endChar after pattern in the text
 * @param text
 * @param pattern
 * @param startChar
 * @param endChar
 * @returns {string}
 */
function ParseString(text, pattern, startChar, endChar)
{
    var pos = text.indexOf(pattern);
    if (pos < 0) return "";

    var str = text.substr(pos + pattern.length);
    pos = str.indexOf(startChar);
    if (pos < 0) return "";

    str = str.substr(pos + startChar.length);
    pos = str.indexOf(endChar);
    if (pos < 0) return "";

    return str.substr(0, pos).trim();
}

/**
 * Creates a concrete site parser object depending on URL
 * @param url
 * @returns {object} SiteParser
  */
function GetSiteParser(url){
    if(url.indexOf(AmazonComParser.MainUrl)!=-1)
        return new AmazonComParser();
    if(url.indexOf(AmazonCoUkParser.MainUrl)!=-1)
        return new AmazonCoUkParser();
    if(url.indexOf(AmazonDeParser.MainUrl)!=-1)
        return new AmazonDeParser();
}

/**
 * Add decimal and thousand delimiters: commas and points
 * @param str
 * @returns {string}
 */
function AddCommas(str)
{
    str += '';
    x = str.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/**
 * Gets a category from the bookData array
 * @param bookData
 * @returns {string}
 */
function GetCategoryFromBookData(bookData){
    bookData = ValueOrDefault(bookData, []);
    if(bookData.length > 0)
        return bookData[0].Category;

    return '';
}