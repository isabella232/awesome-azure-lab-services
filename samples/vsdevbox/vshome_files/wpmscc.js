/////////////////////////////////////////////////////////////////////////////////////////
// The list of approved cookies
_wpmscc_approvedCookies = [

	////////////////////////////////////////////////////////////////////
	// Approved essential cookies
	{ name: '__RequestVerificationToken*', domain: null },
	{ name: '_icl_visitor_lang_js', domain: null },
	{ name: 'A', domain: null },
	{ name: 'ai_session', domain: null },
	{ name: 'ai_user', domain: null },    
	{ name: 'ARRAffinity', domain: null },
	{ name: 'ASPSESSIONID*', domain: null },
	{ name: 'BIGipCookie', domain: null },    
	{ name: 'c', domain: null },
	{ name: 'c9id', domain: null },
	{ name: 'MC0', domain: null },
	{ name: 'MC1', domain: null },
	{ name: 'MS0', domain: null },
	{ name: 'MSCC', domain: null },
	{ name: 'MSFPC', domain: null },
	{ name: 'MSPRequ', domain: null },
	{ name: 'SID', domain: null },
	{ name: 'uaid', domain: null },
	{ name: 'userInfo', domain: null },
	{ name: 'VstsSession', domain: null },
    { name: 'X-Mapping*', domain: null },
    { name: 'VSCOMGeo', domain: null },

	////////////////////////////////////////////////////////////////////
	// Pending essential cookies
	{ name: '_ga', domain: null },
	{ name: '_gat', domain: null },
	{ name: '_gac_*', domain: null },
	{ name: '_gid', domain: null },    
	{ name: 'AMP_TOKEN', domain: null }
];

/////////////////////////////////////////////////////////////////////////////////////////
// Marks where to send the user if their browser doesn't support cookie suppression
_wpmscc_nonCompliantRedirect = 'http://www.microsoft.com';

/////////////////////////////////////////////////////////////////////////////////////////
// Tracks how cookies are intercepted (null if capability does not exist)
_wpmscc_cookieInterceptMode = null;

/**
 * Implements the filtered cookie getter logic.
 * @param {any} _getter The function which will obtain the cookie from the store (if allowed).
 */
function _wpmscc_getCookieOverride(_getter) {
    return _getter();
}

/**
 * Implements the filtered cookie setter logic.
 * @param {any} cookie The value assigned to document.cookie.
 * @param {any} _setter The function which will persist the cookie (if allowed).
 */
function _wpmscc_setCookieOverride(cookie, _setter) {
    var ci = _wpmscc_extractSetCookie(cookie);
    if (ci != null && (ci.value == null || _wpmscc_isApprovedCookie(ci.name))) {
        return _setter(cookie);
    } else {
        return cookie;
    }
}

/**
 * Determine if a cookie is approved.
 * @param {any} cookieName The name of the cookie to check.
 */
function _wpmscc_isApprovedCookie(cookieName) {
    if (cookieName != null && _wpmscc_approvedCookies != null) {
        cookieName = cookieName.trim();
        for (var i = 0; i < _wpmscc_approvedCookies.length; i++) {
            var approvedCookie = _wpmscc_approvedCookies[i];
            var approvedCookieName = approvedCookie.name.trim();

			// Determine if the cookie name matches the current approved cookie
            var isNameMatch = false;
            if (approvedCookieName.length > 0 && approvedCookieName.charAt(approvedCookieName.length - 1) == '*') {
                var prefix = approvedCookieName.substr(0, approvedCookieName.length - 1);
                var prefixLength = prefix.length;
                if (cookieName.substr(0, prefixLength) == prefix) {
                    isNameMatch = true;
                }
            } else {
                if (approvedCookieName == cookieName) {
                    isNameMatch = true;
                }
            }

            if (isNameMatch) {
                // TODO: Perform a domain match?
                return true;
            }
        }
    }

    return false;
}

/**
 * Extracts a data structure with information about a cookie 'SET' operation.
 * @param {any} cookie The cookie value used in the 'SET' operation.
 */
function _wpmscc_extractSetCookie(cookie) {
    var result = {
		'originalCookie': cookie
    };

    if (cookie != null) {
        var nvp = cookie.toString().split(';');
        for (var i = 0; i < nvp.length; i++) {

            var nv = nvp[i].split('=');
            if (nv.length > 0) {
                var name = nv[0].trim();
                var value = null;
                if (nv.length > 1) {
                    value = nv[1];
                }

                switch (name.toLowerCase()) {
                    case 'expires':
                        result.expires = (value != null) ? new Date(value) : null;
                        break;
                    case 'domain':
                        result.domain = value;
                        break;
                    case 'path':
                        result.path = value;
                        break;                    
                    default:
                        if (name.length > 0) {
                            result.name = name;
                            result.value = (value != null && value.trim().length > 0) ? value.trim() : null;
                        }
                        break;
                }
            }
        }
    }

    return result;
}

/**
 * Get a string representing the current call stack.
 */
function wpmscc_getCallStack() {
    var error = new Error();
    if (error != null) {
        var callStack = error.stack;
        if (callStack != null) {
            var startIndex = callStack.indexOf('wpmscc_getCallStack');
            if (startIndex >= 0) {
                startIndex = callStack.indexOf(')', startIndex);
                if (startIndex >= 0) {
                    return callStack.substr(startIndex + 1);
                }
            }
        }
    }

    return '<No Call Stack Available>';
}

/**
 * Registers the cookie intercept callbacks. Returns true if registration was successful, or false otherwise.
 */
function wpmscc_RegisterIntercept() {
    if (wpmscc_getCookie('MSCC') == null) {
        if (wpmscc_getCookie('VSCOMGeo') === 'false') {
            _wpmscc_cookieInterceptMode = 'N/A (Not in EU)';
        }
        else {
            if (_wpmscc_cookieInterceptMode == null) {

                if (Object.getOwnPropertyDescriptor) {
                    var documentPrototype = Document.prototype || HTMLDocument.prototype;
                    if (documentPrototype != null) {
                        var descriptor = Object.getOwnPropertyDescriptor(documentPrototype, 'cookie');
                        if (descriptor != null && descriptor.configurable) {
                            var defaultCookieGetter = descriptor.get;
                            var defaultCookieSetter = descriptor.set;

                            Object.defineProperty(documentPrototype, 'cookie', {
                                get: function () {
                                    return _wpmscc_getCookieOverride(function () {
                                        return defaultCookieGetter.call(document);
                                    });
                                },
                                set: function (cookie) {
                                    return _wpmscc_setCookieOverride(cookie, function (c) {
                                        return defaultCookieSetter.call(document, c);
                                    });
                                }
                            });
                            _wpmscc_cookieInterceptMode = 'ECMAScript 5.1 (JavaScript 1.8.5, June 2011)';
                        }
                    }
                }

                if (_wpmscc_cookieInterceptMode == null) {
                    if (document.__lookupGetter__ && document.__lookupSetter__) {
                        var getterDescriptor = document.__lookupGetter__('cookie');
                        var setterDescriptor = document.__lookupSetter__('cookie');

                        if (getterDescriptor && setterDescriptor) {
                            var defaultCookieGetter = getterDescriptor.bind(document);
                            var defaultCookieSetter = setterDescriptor.bind(document);

                            document.__defineGetter__('cookie', function () {
                                return _wpmscc_getCookieOverride(defaultCookieGetter);
                            });
                            document.__defineSetter__('cookie', function (cookie) {
                                return _wpmscc_setCookieOverride(cookie, defaultCookieSetter);
                            });
                            _wpmscc_cookieInterceptMode = 'ECMAScript 3 (JavaScript 1.5, December 1999)';
                        }
                    }
                }
            }
        }
    }
    else {
        _wpmscc_cookieInterceptMode = 'N/A (Consent Received)';
    }

    return _wpmscc_cookieInterceptMode != null;
}

// Register for cookie intercept, and if that fails, redirect
if (!wpmscc_RegisterIntercept()) {
    //window.stop();
    //window.location = _wpmscc_nonCompliantRedirect;
    console.warn('This browser does not support cookie intercept. A redirect would happen in this case.');
}