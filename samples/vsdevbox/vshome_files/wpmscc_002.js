function WpMscc() {
    var that = this;

	////////////////////////////////////////////////////////////////////////////////////////
	// Private fields
    this._canUseCookies = false;
    this._msccResponse = null;
    this._cookies = '';
    this._cookieListenerInterval = 1000;
    this._onCookiesEnabledEvents = [];

	////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
    this.getMsccSettings = function () {
        return wpmscc_GetMsccSettings();
    };

    this.showNoticeBanner = function (show) {
        var msccNoticeBanner = jQuery("#msccBanner");
        if (msccNoticeBanner != null) {
            if (show === true) {
                msccNoticeBanner.show();
            }
            else {
                msccNoticeBanner.hide();
            }
        }
    };
    this.canUseCookies = function () {
        return wpmscc.isMsccEnabled === false || this._canUseCookies;
    };
    this.appendStyleSheet = function (url) {
        if (document.createStyleSheet) {
            document.createStyleSheet(url);
        } else {
            jQuery("head").append('<link rel="stylesheet" type="text/css" href="' + url + '">');
        }
    };
    this.onCookiesEnabled = function(fn) {
        this._onCookiesEnabledEvents.push(fn);
    };

	////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
    this._setMsccResponse = function (msccResponse) {
        var previousCanUseCookies = this.canUseCookies();
        if (!previousCanUseCookies) {
            this._msccResponse = msccResponse;

            this._canUseCookies = typeof mscc !== 'undefined' &&
                mscc != null &&
                this._msccResponse != null &&
                (!this._msccResponse.IsConsentRequired || mscc.hasConsent());

            // If the cookies enabled flag flipped to [ON], we can use cookies
            if (!previousCanUseCookies && this._canUseCookies) {
                this._raiseOnCookiesEnabledEvent(false);
            }
        }
    };
    this._raiseOnCookiesEnabledEvent = function (isInitialConsent) {
        console.log("Exeucting WpMscc::_raiseOnCookiesEnabledEvent with isInitialConsent=" + isInitialConsent);
        this.showNoticeBanner(false);
        this._onCookiesEnabledEvents.forEach(function (fn) {
            if (fn != null) {
                fn.apply(null, [this, isInitialConsent === true]);
            }
        });
    };    

    var _onUserInteractionCallback = function (eventObject) { that._onUserInteraction(eventObject); }
    this._bindUserInteraction = function () {
        console.log("Exeucting WpMscc::_bindUserInteraction");
        jQuery('body').click(_onUserInteractionCallback);
    };
    this._unbindUserInteraction = function () {
        console.log("Exeucting WpMscc::_unbindUserInteraction");

        jQuery('body').unbind('click', _onUserInteractionCallback);
    };
    this._onUserInteraction = function (eventObject) {
        if (!mscc.hasConsent()) {
			// Exclude anything under the main banner
            var msccBanner = document.getElementById('msccBanner');
            var isChildOfMsccBanner = msccBanner != null && (msccBanner == eventObject.target || msccBanner.contains(eventObject.target));

			// Exclude the language picker
            var isLanguagePicker = eventObject.target.id != null && eventObject.target.id == 'js-lang-picker';

			// Exclude all elements with the data-mscc-ic set to false
            var dataMsccIcAttribute = eventObject.target.getAttribute('data-mscc-ic');
            var isExempt = dataMsccIcAttribute != null && dataMsccIcAttribute.toString().toLowerCase() == "false";

            if (!isLanguagePicker && !isChildOfMsccBanner && !isExempt) {
                mscc.setConsent();
                this._unbindUserInteraction();                
            }
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////
// Construct the WordPress Microsoft Cookie Compliance object
wpmscc = new WpMscc();

jQuery(document).ready(function () {

    var msccSettings = wpmscc.getMsccSettings();
    if (msccSettings.isMsccEnabled === false) {
        console.log("WPMSCC is disabled, notifying registered listeners that cookies are enabled!");
        wpmscc._raiseOnCookiesEnabledEvent(false);
        return;
    }

    if (consentRequired === false) {
    
        wpmscc._raiseOnCookiesEnabledEvent(false);
        return;
    }

    var endpointUrl = msccSettings.msccRestApiRootUrl + '/'
        + msccSettings.currentLocaleCode +
        '/shell/api/mscc?sitename=' + msccSettings.siteName +
        '&domain=' + msccSettings.domain +
        '&country=' + msccSettings.country +
        '&mscc_eudomain=true';	// This last param is a test flag, we'll remove it later. It forces the IsConsentRequired flag to true.

    if (needTodetermineRegion === true) {
        jQuery.ajax({
            url: '/wp-json/vscom/v1/geo-location-api',
            type: 'GET',
            success: function (output) {
                var isInEU;
                if (output.isInEU === 'false') {
                    isInEU = false;
                }
                else if (output.isInEU === 'true') {
                    isInEU = true;
                    showMsccBanner(endpointUrl);
				}
				else {
					showMsccBanner(endpointUrl);
				}
                if (typeof (isInEU) != 'undefined' && isInEU != null) {
                    var vscomGeo = new VscomGeo();
                    vscomGeo.setCookie(isInEU);
                    consentRequired = isInEU;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMsccBanner(endpointUrl);
            }
        });
    }
    else {
        showMsccBanner(endpointUrl);
    }
});

function showMsccBanner(endpointUrl) {

    wpmscc.msccResponse = null;

    jQuery.ajax(
        endpointUrl, {
            success: function (data, text) {
                // We need to dynamically inject all of the CSS references returned by the API
                if (data.Css != null) {
                    for (var i = 0; i < data.Css.length; i++) {
                        wpmscc.appendStyleSheet(data.Css[i]);
                    }
                }

                // We need to dynamically inject all of the JS references returned by the API, too
                if (data.Js != null) {
                    for (var i = 0; i < data.Js.length; i++) {
                        var currentIndex = i;
                        jQuery.getScript(data.Js[i], function (script, status, jqXHR) {

                            if (currentIndex == data.Js.length - 1) {
                                wpmscc._setMsccResponse(data);

                                if (!wpmscc.canUseCookies()) {

                                    // Inject the markup from the MSCC API, and show it
                                    jQuery("#headerArea").before(data.Markup);
                                    wpmscc.showNoticeBanner(true);

                                    mscc.on('consent', function () {
                                        wpmscc._raiseOnCookiesEnabledEvent(true);
                                    });

                                    wpmscc._bindUserInteraction();
                                }
                            }
                        });
                    }
                }
            },
            error: function (request, status, error) {
                console.error('The Microsoft Cookie Compliance REST API call failed. ' + error)
            }
        });
}
