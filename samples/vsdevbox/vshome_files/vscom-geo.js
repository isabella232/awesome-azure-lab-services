function VscomGeo() {
    var that = this;

	////////////////////////////////////////////////////////////////////////////////////////
	// Public fields
    this.cookieName = "VSCOMGeo";
    this.isInEU = null;

	////////////////////////////////////////////////////////////////////////////////////////
	// Private fields
    this._expirationInterval = 30;

	////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
    this.setCookie = function (isInEU) {
        that.isInEU = isInEU;
        var d = new Date();
        d.setTime(d.getTime() + (that._expirationInterval * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = that.cookieName + "=" + isInEU + ";" + expires + ";path=/";
    };
}

/**
 * Reads the value of a cookie.
 * @param {any} cookieName The name of the cookie whose value should be read.
 */
function wpmscc_getCookie(cookieName) {
    var cookies = document.cookie;
    var nvp = cookies.split(';');
    for (var i = 0; i < nvp.length; i++) {
        var nv = nvp[i].split('=');
        if (nv.length > 0) {
            var name = nv[0].trim();
            if (name == cookieName) {
                return nv.length > 1 ? nv[1].trim() : null;
            }
        }
    }

    return null;
}