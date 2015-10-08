/**
 * BootstrapJS is an immediate self-invoked singleton class instance providing application startup
 * features, such as dynamic loading of CSS and JavaScript files. Boot sequence support, loaded script
 * support, on demand script loading, browser and version dependency, and splash screen support.
 *
 * @author Jonathan Griffin <griffiti93@gmail.com>
 * @class Bootstrap
 * @singleton
 */
Bootstrap = function() {
    /** PRIVATE MEMBERS */
	var _bootstrap           = null;
	var _animTarget          = null;
	var _splashDiv           = null;
    var _loaderDiv           = null;
    var _loadedScripts       = new Array();
    var _currentBootSequence = 0;
    var _startTime           = null;
    var _finishTime          = null;
	var _activeX             = ['MSXML2.XMLHTTP.3.0','MSXML2.XMLHTTP','Microsoft.XMLHTTP']


    /**
     * Browser checks taken and modified from ExtJS source.
     *
     * Ext JS Library 3.3.1
     * Copyright(c) 2006-2010 Sencha Inc.
     * licensing@sencha.com
     * http://www.sencha.com/license
     */
    var _docMode = document.documentMode;
    var _ua = navigator.userAgent.toLowerCase();
    var check = function(r) {
        return r.test(_ua);
    };
    var _isOpera = check(/opera/);
    var _isIE = !_isOpera && check(/msie/);
    var _isIE7 = _isIE && (check(/msie 7/) || _docMode == 7);
    var _isIE8 = _isIE && (check(/msie 8/) && _docMode != 7);
    var _isIE6 = _isIE && !_isIE7 && !_isIE8;



    /** PRIVATE METHODS */
	var createXMLHttpRequest = function() {
		var http;
        try
        {
            http = new XMLHttpRequest();
        }
        catch(e)
        {
            for (var i = 0; i < _activeX.length; ++i) {
                try
                {
                    http = new ActiveXObject(_activeX[i]);
                    break;
                }
                catch(e) {
                }
            }
        }
        finally
        {
            return http;
        }
	};

    var requestURL = function(xmlReq, url, cached, callback) {
        if (xmlReq == null) {
			alert('Error loading application. Your browser may not support AJAX.');
			return;
		}

		// Support for disabling browser caching.
		if (!cached) {
			url = url + '?' + new Date().getTime();
		}

		// Setup request callback.
		xmlReq.onreadystatechange = callback;

		// Make request.
        xmlReq.open("GET", url, true);
        xmlReq.send(null);
    };

	var loadBootstrap = function(bootstrap) {
		// load bootstrap from object literal
		if (typeof bootstrap == 'object') {
            _bootstrap = bootstrap;
			init();
        }

        // load bootstrap from file on server
        if (typeof bootstrap == 'string') {
			var xmlReq = createXMLHttpRequest();
			var callback = bootstrapCallback(xmlReq);
			requestURL(xmlReq, bootstrap, false, callback);
        }

		return;
	};

	var bootstrapCallback = function(xmlReq) {
		return (function() {
			if (xmlReq.readyState == 4) {
	            try {
	                _bootstrap = eval('(' + xmlReq.responseText + ')');
	                init();
	            } catch (e) { alert('Error parsing bootstrap configuration. Make sure it is valid JSON.');}
	        }
		});
	};

	var init = function() {
		try {
            if (typeof _bootstrap.bootOrder == 'undefined') {
                alert('Error loading application. Bootstrap configuration does not contain a bootOrder property.');
                return;
            }

			if (_bootstrap.openerRequired) {
				checkApplicationOpener();
			}

	        buildAnimTarget();

			buildSplashScreen();

            addEventHandlers();

			window.setTimeout(Bootstrap.loadScripts, 250);

	    } catch (e) { alert(e); }
	};

    /**
     * Ensure application window is opened from launcher. The try/catch statement
     * protects permission denied errors thrown if trying to access a window.opener
     * object from another domain - in the case where someone tries to roll their own
     * launcher.
     */
    var checkApplicationOpener = function() {
        // Accomodate for already opened applications (in case opener is closed)
        if (window.location.search == _bootstrap.appOpened) {
            return;
        }

        // Make sure application opened from a launcher
        try {
            if (!window.opener) window.location = _bootstrap.launchRedirect;

            var openerPath = window.opener.location.pathname;
            var openerScript = openerPath.substring(openerPath.lastIndexOf('/'));

            if ( (openerScript == '/' + _bootstrap.openerScript) || (openerScript == '/') ) {
                return;
            } else {
                window.location = _bootstrap.launchRedirect;
            }

        } catch (e) {
            window.location = _bootstrap.launchRedirect;
        }
    };

    /**
     * Location holder for animation target used for animated elements.
     */
    var buildAnimTarget = function() {
        _animTarget = document.createElement('div');
        _animTarget.setAttribute('id', 'anim-target');
		_animTarget.style.top = _bootstrap.animTarget.top;
		_animTarget.style.left = _bootstrap.animTarget.left;

        var body = document.getElementById(_bootstrap.bodyTag);
        body.appendChild(_animTarget);
    };

    var buildSplashScreen = function() {
        // setup splash div
        _splashDiv = document.createElement('div');
        _splashDiv.setAttribute('id', 'splash');
        setSplashDivStyle();

        // setup nested version div
        // TODO: Add check for version existence.
        var versionDiv = document.createElement('div');
        versionDiv.setAttribute('id', 'splash-version');
        versionDiv.innerHTML = _bootstrap.versionLabel + ' ' + _bootstrap.versionNumber;
        setSplashChildDivStyle(versionDiv, _bootstrap.splash.version);
        _splashDiv.appendChild(versionDiv);

        // setup loader div
        _loaderDiv = document.createElement('div');
        _loaderDiv.setAttribute('id', 'splash-loader');
        setLoaderDivStyle();
        _splashDiv.appendChild(_loaderDiv);

        // setup nested message div
        // TODO: Add check for message existence.
        var messageDiv = document.createElement('div');
        messageDiv.setAttribute('id', 'splash-message');
        setSplashChildDivStyle(messageDiv, _bootstrap.splash.message);
        _splashDiv.appendChild(messageDiv);

        // setup nested copyright div
        // TODO: Add check for copyright existence.
        var copyrightDiv = document.createElement('div');
        copyrightDiv.setAttribute('id', 'copyright-message');
        setSplashChildDivStyle(copyrightDiv, _bootstrap.splash.copyright);
        _splashDiv.appendChild(copyrightDiv);

        // center splash div in browser
        centerSplashDiv();

        // render splash div
        var body = document.getElementById(_bootstrap.bodyTag);
        body.appendChild(_splashDiv);

        // set copyright
        Bootstrap.setCopyrightMessage(_bootstrap.copyrightMessage);
    };

	var setSplashDivStyle = function() {
		var splash = _bootstrap.splash;

		_splashDiv.style.position = splash.position;
		_splashDiv.style.border = splash.border;
		_splashDiv.style.background = splash.background;
		_splashDiv.style.width = splash.width + 'px';
		_splashDiv.style.height = splash.height + 'px';
		_splashDiv.style.zIndex = splash.zIndex;
	};

    var setLoaderDivStyle = function() {
        var loader = _bootstrap.splash.loader;

        _loaderDiv.style.position = loader.position;
        _loaderDiv.style.top = loader.top;
        _loaderDiv.style.left = loader.left;
        _loaderDiv.style.border = loader.border;
        _loaderDiv.style.background = loader.background;
        _loaderDiv.style.width = loader.width;
        _loaderDiv.style.height = loader.height;
    };

    var setSplashChildDivStyle = function(div, config) {
        div.style.position = config.position;
		div.style.top = config.top;
		div.style.left = config.left;
		div.style.border = config.border;
		div.style.width = config.width;
		div.style.fontFamily = config.fontFamily;
		div.style.fontSize = config.fontSize;
        div.style.fontWeight = config.fontWeight;
		div.style.textAlign = config.textAlign;
        div.style.color = config.color;
    };

	var centerSplashDiv = function() {
		// var centerTop = (document.body.clientHeight - _bootstrap.splash.height) / 2;
        var centerTop = (window.innerHeight - _bootstrap.splash.height) / 2;
        var centerLeft = (document.body.clientWidth - _bootstrap.splash.width) / 2;

		_splashDiv.style.left = centerLeft + document.body.scrollLeft + 'px';
        _splashDiv.style.top = centerTop + document.body.scrollTop + 'px';
	};

    var addEventHandlers = function() {
        // Wire up resize event
        window.onresize = centerSplashDiv;
    };

    var removeEventHandlers = function() {
        // Remove resize event handler
        window.onresize = null;
    };

	var loadBootGroup = function(name) {
        try {
            var head = document.getElementsByTagName('head')[0];

            var bootGroup = fetchBootGroup(name);

            // Capture boot group start time.
            var now = new Date();
            bootGroup.startTime = now.getTime();

            Bootstrap.setSplashMessage((bootGroup.message || 'Loading libraries...'));

            for (var i = 0; i < bootGroup.files.length; i++) {
                // Grab file object.
                var script = bootGroup.files[i];

                var altIEScriptConfig = getAltIEScriptConfig(script);

                var uri = altIEScriptConfig.ieUri == null ? script.uri : altIEScriptConfig.ieUri;
                var test = altIEScriptConfig.ieTest == null ? script.test : altIEScriptConfig.ieTest;

                // Support group level caching with script level override.
                var cache = bootGroup.cache;
                if (typeof script.cache !== 'undefined') cache = script.cache;

                // Setup DOM element based on boot group type.
                var element = null;
                if (bootGroup.type == 'js') {
	                element = document.createElement('script');
	                element.setAttribute('type', 'text/javascript');
                    element.setAttribute('src', (cache ? uri : uri + '?' + new Date().getTime()));
	            }
	            if (bootGroup.type == 'css') {
	                element = document.createElement('link');
	                element.setAttribute('type', 'text/css');
                    element.setAttribute('rel', 'stylesheet');
                    element.setAttribute('href', (cache ? uri : uri + '?' + new Date().getTime()));
	            }

                if (element) {
                    head.appendChild(element);
                }

                // Start polling for loaded script.
                if (bootGroup.type == 'js') isScriptLoaded(uri, test);
                if (bootGroup.type == 'css') isStyleLoaded(uri, test);
            }
        } catch (err) {
            Bootstrap.log(err);
        }
	};

    /**
     * Support alternate IE uri (with optional version support).
     * Support alternate IE test (with optional version support).
     * @param script
     * @return {Object} config
     */
    var getAltIEScriptConfig = function(script) {
        var config = {
            ieUri: null,
            ieTest: null
        };

        // Support alternate IE uri (with optional version support).
        if (typeof script.ieUri !== 'undefined' && _isIE) {
            if (typeof script.ieVersion !== 'undefined') {
                if (script.ieVersion == '6' && _isIE6) config.ieUri = script.ieUri;
                if (script.ieVersion == '7' && _isIE7) config.ieUri = script.ieUri;
                if (script.ieVersion == '8' && _isIE8) config.ieUri = script.ieUri;
            } else {
                config.ieUri = script.ieUri;
            }
        }

        // Support alternate IE test (with optional version support).
        if (typeof script.ieTest !== 'undefined' && _isIE) {
            if (typeof script.ieVersion !== 'undefined') {
                if (script.ieVersion == '6' && _isIE6) config.ieTest = script.ieTest;
                if (script.ieVersion == '7' && _isIE7) config.ieTest = script.ieTest;
                if (script.ieVersion == '8' && _isIE8) config.ieTest = script.ieTest;
            } else {
                config.ieTest = script.ieTest;
            }
        }

        return config;
    };

    var fetchBootGroup = function(name) {
        var bootGroups = _bootstrap.bootGroups;
        var selectedBootGroup = null;

        for (var i = 0; i < bootGroups.length; i++) {
            if (bootGroups[i].name == name) {
                selectedBootGroup = bootGroups[i];
                break;
            }
        }

        if (selectedBootGroup == null) { throw 'Error loading boot group.'; }

        return selectedBootGroup;
    };

    var isScriptLoaded = function(script, test) {
        // Accomodate namespaces.
        var namespaces = test.split(".");

        if ((namespaces.length > 1 ? (typeof(window[namespaces[0]]) == 'undefined' ? false : true) : true) && (eval('typeof ' + test) == 'undefined' ? false : true)) {
            scriptLoaded(script);
        } else {
            window.setTimeout(function() {
                isScriptLoaded(script, test);
            }, 50);
        }
    };

    var isStyleLoaded = function(script, test) {
        // Grab all existing stylesheets.
        var sheets = document.styleSheets;

        // Parse all existing rules.
        var rules = {};
        for (var i = 0, len = sheets.length; i < len; i++) {
            try {
                var sheet = sheets[i];

				var sheetRules = sheet.cssRules || sheet.rules;
				for (var j = sheetRules.length-1; j >= 0; --j) {
				    rules[sheetRules[j].selectorText] = sheetRules[j];
				}
            } catch (e) {}
        }

        // Check for existence of test selector.
        if (rules[test]) {
            scriptLoaded(script);
        } else {
            window.setTimeout(function() {
                isStyleLoaded(script, test);
            }, 50);
        }
    };

    /**
     * Marks a script as loaded. Checks if all scripts have loaded and
     * performs applicable callbacks.
     */
    var scriptLoaded = function(script) {
        // Mark script as loaded.
        _loadedScripts[_loadedScripts.length] = script;

        if (_bootstrap.verbose) { Bootstrap.log('     ' + script + ' loaded.'); }

        // Check if current boot group is loaded. If not fully loaded, return.
        if (!Bootstrap.isBootGroupLoaded(_bootstrap.bootOrder[_currentBootSequence])) { return; }

        if (_bootstrap.debug) { Bootstrap.log(_bootstrap.bootOrder[_currentBootSequence] + ' loaded.'); }

		// Grab current boot group.
		var bootGroup = fetchBootGroup(_bootstrap.bootOrder[_currentBootSequence]);

		// Capture boot group end time.
		var now = new Date();
        bootGroup.finishTime = now.getTime();

		// Run boot group callback if applicable.
		if (bootGroup.callback) {
			eval(bootGroup.callback).call();
		}

        // Since boot group is loaded, increment current boot group.
        _currentBootSequence++;

        // If current boot sequence equals boot order list, fire callback. Otherwise, load next group.
        if (_currentBootSequence == _bootstrap.bootOrder.length) {
			// Capture global end time.
		    _finishTime = now.getTime();

			if (_bootstrap.debug) { Bootstrap.report(); }

			// Run global callback if applicable.
            if (_bootstrap.callback) {
                if (typeof _bootstrap.callback == 'function') { _bootstrap.callback.call(); }
                if (typeof _bootstrap.callback == 'string') { eval(_bootstrap.callback+'.call()'); }
            }

            removeEventHandlers();

        } else {
            window.setTimeout(Bootstrap.loadScripts, 250);
        }
    };

    var checkLoadedScript = function(script) {
        var scriptLoaded = false;
        for (var i = 0; i < _loadedScripts.length; i++) {
            if (_loadedScripts[i] == script) {
                scriptLoaded = true;
                break;
            }
        }
        return scriptLoaded;
    };

    var parseTimeStamp = function(date) {
        var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
        var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return hours + ':' + minutes + ':' + seconds + ':' + date.getMilliseconds();
    };

    /***
	 * parseUri JS v0.1, by Steven Levithan (http://badassery.blogspot.com)
	 * Splits any well-formed URI into the following parts (all are optional):
	 *
	 * @param {Object} sourceUri
	 *
	 * returns:
	 * source (since the exec() method returns backreference 0 [i.e., the entire match] as key 0, we might as well use it)
	 * protocol (scheme)
	 * authority (includes both the domain and port)
	 *   domain (part of the authority; can be an IP address)
	 *   port (part of the authority)
	 * path (includes both the directory path and filename)
	 *   directoryPath (part of the path; supports directories with periods, and without a trailing backslash)
	 *   fileName (part of the path)
	 * query (does not include the leading question mark)
	 * anchor (fragment)
	 */
	var parseUri = function(sourceUri){
		var uriPartNames = ["source", "protocol", "authority", "domain", "port", "path", "directoryPath", "fileName", "query", "anchor"];
		var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri);
		var uri = {};

		for (var i = 0; i < 10; i++) {
			uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
		}

		// Always end directoryPath with a trailing backslash if a path was present in the source URI
		// Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key
		if (uri.directoryPath.length > 0) {
			uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
		}

		return uri;
	};

    var parseBootstrapFile = function() {
        var bootstrap = null;

        var uri = parseUri(window.location);
        if (uri.query == null || uri.query == '') return bootstrap;

        // Parse for bootstrap param.
        var query = unescape(uri.query);
        var params = query.split('&');
        for (var i = 0; i < params.length; i++) {
            var param = params[i].split('=');
            if (param[0] == 'bootstrap') {
                bootstrap = typeof param[1] == 'undefined' || param[1] == '' ? null : param[1];
                break;
            }
        }
        return bootstrap;
    }



    /** PUBLIC API */
    return {
        /**
         * Loads application from a bootstrap configuration. Accepts an object literal or a URL for server side retrieval.
         * @param {Object | String} bootstrap Contains boot groups and sequence order. Can be an object literal or a string representing a file on the server.
         * @param {Object} config Bootstrap configuration options
         */
        run: function() {
            // Capture global start time.
            var now = new Date();
            _startTime = now.getTime();

            var bootstrap = parseBootstrapFile();

            // Load default bootstrap if not defined.
            if (bootstrap == null) {
                bootstrap = 'bootstrap.json';
            }

            // Load bootstrap.
			loadBootstrap(bootstrap);
        },

        log: function(message) {
			if (typeof(console) != 'undefined') {
                var timestamp = parseTimeStamp(new Date());

				console.log(timestamp + ' - ' + message);
			}
        },

		getAnimTarget: function() {
			return _animTarget;
		},

		getBootstrap: function() {
			return _bootstrap;
		},

        setSplashMessage: function(message, append) {
            var splashMessage = document.getElementById('splash-message');
            if (splashMessage != null) {
                if ((typeof append != 'undefined') && (append == true)) {
                    splashMessage.innerHTML = splashMessage.innerHTML + message;
                } else {
                    splashMessage.innerHTML = message;
                }
            }
        },

        isSplashShowing: function() {
        	return (_splashDiv.style.visibility == 'visible');
        },

		showSplash: function(hideLoader) {
            _splashDiv.style.visibility = 'visible';

            if ((typeof(hideLoader) != 'undefined') && hideLoader) {
                _loaderDiv.style.visibility = 'hidden';
            } else {
                _loaderDiv.style.visibility = 'visible';
            }
        },

        hideSplash: function() {
            _splashDiv.style.visibility = 'hidden';
            _loaderDiv.style.visibility = 'hidden';
        },

        setCopyrightMessage: function(message) {
            var copyrighthMessage = document.getElementById('copyright-message');
            if (copyrighthMessage != null) {
                copyrighthMessage.innerHTML = message;
            }
        },

        /**
         * Loads dependent scripts from server in boot order.
         */
        loadScripts: function() {
            if (!_bootstrap.bootOrder || _bootstrap.bootOrder.length < 1) {
				alert('Please provide a boot order for scripts.'); return;
			}

			try {
            	loadBootGroup(_bootstrap.bootOrder[_currentBootSequence]);

			} catch (e) { alert(e); }
        },

        /**
         * Set callback used when scripts have loaded. Can be function or string.
         */
        setCallback: function(callback) {
            _bootstrap.callback = callback;
        },

        /**
         * Pushes additional boot group onto boot order.
         */
        addToBootOrder: function(name) {
            _bootstrap.bootOrder.push(name);
        },

        isBootGroupLoaded: function(name) {
            var bootGroup = fetchBootGroup(name);
            var scriptsLoaded = 0;

        	// Iterate through bootGroup, checking each file against loaded scripts.
        	for (var i = 0; i < bootGroup.files.length; i++) {
                var script = bootGroup.files[i];
                var altIEScriptConfig = getAltIEScriptConfig(script);
                var uri = altIEScriptConfig.ieUri == null ? script.uri : altIEScriptConfig.ieUri;

        		if (checkLoadedScript(uri)) {
        			scriptsLoaded++;
        		}
        	}

        	return (bootGroup.files.length == scriptsLoaded);
        },

		report: function() {
			var msPerSecond = 60 * 1000;
            var loadTime = (_finishTime - _startTime) / msPerSecond;
            Bootstrap.log('Load time: ' + loadTime + ' seconds');

			for (var i = 0; i < _bootstrap.bootOrder.length; i++) {
				var bootGroup = fetchBootGroup(_bootstrap.bootOrder[i]);
				var bootGroupLoadTime = (bootGroup.finishTime - bootGroup.startTime) / msPerSecond;
				Bootstrap.log('\t\t' + bootGroup.name + ' load time: ' + bootGroupLoadTime + ' seconds');
	        }
		}
    };
}();

window.onload = Bootstrap.run;