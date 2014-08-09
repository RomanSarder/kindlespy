/**
 * Created by Andrey on 09.08.14.
 */

/**
 * Parses URL and returns a get parameter requested
 * @param url - url to parse
 * @param name - parameter name
 * @returns parameter value
  */
function GetParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**
 * Returns default value if parameter is not passed to function, otherwise returns it's value.
 * @param param - parameter
 * @param defaultValue - default param value
 * @returns default value if parameter is not set
  */
function ValueOrDefault(param, defaultValue){
    return typeof param !== 'undefined' ? param : defaultValue;
}