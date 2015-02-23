/*
 * BootstrapJS 1.0
 * Copyright(c) 2008, Jonathan Griffin
 * griffiti93@yahoo.com
 * 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 */

/**
 * Bootstrap is an immediate self-invoked singleton class instance providing application startup
 * features, such as dynamic loading of CSS and JavaScript files. Boot sequence support, loaded script
 * support, and on demand script loading.
 *
 * @author Jonathan Griffin
 * @class Bootstrap
 * @singleton
 */
Bootstrap = function() {
    /** PRIVATE MEMBERS */
	var _bootstrap           = null;
	var _animTarget          = null;
	var _splashDiv           = null;
    var _loadedScripts       = new Array();
    var _currentBootSequence = 0;
    var _startTime           = null;
    var _finishTime          = null;
	var _activeX             = ['MSXML2.XMLHTTP.3.0','MSXML2.XMLHTTP','Microsoft.XMLHTTP']



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
		setSplashDivStyle(_splashDiv);

		// setup nested message div
        var messageDiv = document.createElement('div');
        messageDiv.setAttribute('id', 'splash-message');
		setSplashMessageDivStyle(messageDiv);

        _splashDiv.appendChild(messageDiv);

		// center splash div in browser
		centerSplashDiv(_splashDiv);

		// render splash div
		var body = document.getElementById(_bootstrap.bodyTag);
        body.appendChild(_splashDiv);
    };
	
	var setSplashDivStyle = function(splashDiv) {
		var splash = _bootstrap.splash;
		
		splashDiv.style.position = splash.position;
		splashDiv.style.border = splash.border;
		splashDiv.style.background = splash.background;
		splashDiv.style.width = splash.width + "px";
		splashDiv.style.height = splash.height + "px";
		splashDiv.style.zIndex = splash.zIndex;
	};
	
	var setSplashMessageDivStyle = function(messageDiv) {
		var message = _bootstrap.splash.message;
		
		messageDiv.style.position = message.position;
		messageDiv.style.top = message.top;
		messageDiv.style.left = message.left;
		messageDiv.style.border = message.border;
		messageDiv.style.width = message.width;
		messageDiv.style.fontFamily = message.fontFamily;
		messageDiv.style.fontSize = message.fontSize;
		messageDiv.style.textAlign = message.textAlign;
	};
	
	var centerSplashDiv = function(splashDiv) {
		var centerTop = (document.body.clientHeight - _bootstrap.splash.height) / 2;
        var centerLeft = (document.body.clientWidth - _bootstrap.splash.width) / 2;
        
		splashDiv.style.left = centerLeft + document.body.scrollLeft;
        splashDiv.style.top = centerTop + document.body.scrollTop;
	};
	
	var loadBootGroup = function(name) {
		var head = document.getElementsByTagName('head')[0];
		
		var bootGroup = fetchBootGroup(name);
		
		// Capture boot group start time.
		var now = new Date();
        bootGroup.startTime = now.getTime();
		
		Bootstrap.setSplashMessage((bootGroup.message || 'Loading libraries...'));
		
		for (var i = 0; i < bootGroup.files.length; i++) {
			var script = bootGroup.files[i];
			
            var element = null;
            element = document.createElement('script');
            element.setAttribute('type', 'text/javascript');

            if (bootGroup.cache) { element.setAttribute('src', script.uri); }
            else { element.setAttribute('src', script.uri + '?' + new Date().getTime()); }

            if (element) { head.appendChild(element); }
			
			var loaded = isScriptLoaded(script.uri, script.test);
			window.setTimeout(loaded, 500);
        }
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

        if (selectedBootGroup == null) { throw new Exception('Error loading boot group.'); }

        return selectedBootGroup;
    };
	
	var isScriptLoaded = function(script, test) {
		return (function() {
			if ('undefined' == eval('typeof ' + test)) {
				var loaded = isScriptLoaded(script, test);
				window.setTimeout(loaded, 500);
			} else {
				scriptLoaded(script);
			}
		});
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
        if (!checkBootGroupLoaded()) { return; }

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
        } else {
            window.setTimeout(Bootstrap.loadScripts, 250);
        }
    };
	
    var checkBootGroupLoaded = function() {
        var bootGroup = fetchBootGroup(_bootstrap.bootOrder[_currentBootSequence]);
        var scriptsLoaded = 0;
		
		// Iterate through bootGroup, checking each file against loaded scripts.
		for (var i = 0; i < bootGroup.files.length; i++) {
			if (checkLoadedScript(bootGroup.files[i].uri)) {
				scriptsLoaded++;
			}
		}
		
		return (bootGroup.files.length == scriptsLoaded);
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



    /** PUBLIC API */
    return {
        /**
         * Loads application from a bootstrap configuration. Accepts an object literal or a URL for server side retrieval.
         * @param {Object | String} bootstrap Contains boot groups and sequence order. Can be an object literal or a string representing a file on the server.
         * @param {Object} config Bootstrap configuration options
         */
        run: function(bootstrap) {
            // Capture global start time.
            var now = new Date();
            _startTime = now.getTime();

            // Load default bootstrap if not defined.
			if (typeof bootstrap == 'undefined' || typeof bootstrap != String) {
                bootstrap = 'bootstrap.txt';
            }

            // Load bootstrap.
			loadBootstrap(bootstrap);
        },

        log: function(message) {
			var timestamp = parseTimeStamp(new Date());
			
			if (console) {
				console.log(timestamp + ' - ' + message);
			} else {
				alert(timestamp + ' - ' + message);
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
		
		showSplash: function() {
			_splashDiv.style.visibility = 'visible';
		},
		
		hideSplash: function() {
			_splashDiv.style.visibility = 'hidden';
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