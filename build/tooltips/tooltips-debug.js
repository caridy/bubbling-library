/**
 * Tooltip Manager Definition: Create floating element to display hints/information based on the trigger element.
 *
 * @namespace YAHOO.widget
 * @module tooltipmanager
 * @requires yahoo
 * @requires event
 * @requires dom
 * @requires bubbling
 */
(function() {

    var $B = YAHOO.Bubbling,
  	    $L = YAHOO.lang,
	    $E = YAHOO.util.Event,
	    $D = YAHOO.util.Dom,
	    $ =  YAHOO.util.Dom.get;

	/**
	 * The Tooltips Manager Widget
	 * @class TooltipManager
	 * @static 
	 */
	YAHOO.widget.TooltipManager = function() {
		var obj = {},
			_areas = {},
			_handle = 'yui-cms-snap',
			_className = 'yui-cms-tt',
			_loadingClass = 'loading',
			_status = false,
			_ready = false,
			_timer = null,
			_delayTimer = null,
			_pos = [0, 0],
			_defConf   = {
							zIndex: 1000,
							opacity: 0.9,
							preventoverlap: true,
							showdelay: 200,
							effect: null,
							autodismissdelay: 5000,
							text: '',
							underlay: "shadow",
							width: 'auto',
							height: 'auto',
							close: false
						 };
		// private stuff
		// pasive behavior...
	    var actionControl = function (layer, args) {
	  	  var el = obj.finder(args[1].target) || args[1].anchor;
	      if ($L.isObject(el)) {
	      	// discard forbbiden areas
	   		for (var i=0; i<obj.forbbiden.length; i++) {
		      if ($L.isObject( $B.getOwnerByClassName( el, obj.forbbiden[i] ))) {
		         return;
		      }
			}
		    // the tooltip will be showed... and the event continue...
	      	obj.check ( args[0], el );
		  }
	    };
  		var _save = function () {
			obj.backup = {title:obj.element.getAttribute('title')};
			obj.element.setAttribute('title', '');
		};
		var _restore = function () {
			if (obj.element && obj.backup.title) {
			  obj.element.setAttribute ('title', obj.backup.title);
			}
		};
		var _generatePath = function ( path, limit ) {
			limit = limit || 30;
			// based on the full URL parser RE: new RegExp("^((?:http|https)://)((?:\\w+[\.|-]?)*\\w+)(/.*)$", 'i') or /^((?:http|https):\/\/)((?:\w+[\.|-]?)*\w+)(\/.*)/i
			var reURI = new RegExp('^((?:http|https)://)('+document.domain+')(/.*)$', 'i'),  // checking if the URL if internal
			    reClearUri = /#.*/,
				uri = path || '',
				current = new String(document.location);
			// discarding the #part....
			uri = uri.replace (reClearUri, '');
			current = current.replace (reClearUri, '');
			var m = uri.match(reURI); // checking the RE to verify if the url is internal...
			if (m) {
				// the uri is internal, discard the protocol and the domain...
				// checking if is different of the current page...
				uri = ((uri == current)?'':m[3]);
			}
			if (!uri || (uri.indexOf('javascript:') === 0) || (uri == '/')) {
			  uri = ''; // remove the anchor links if empty or null
			}
			else {
			  uri = (uri.length > limit ? uri.substring(0,limit)+"..." : uri); // trimming long strings
			}
			return uri;
		};
		// public vars
		obj.handleOverlay = null;
		obj.element = null;
		obj.body = '';
		obj.header = null;
		obj.footer = null;
		obj.onCompile = null;
		obj.onRender = null;
		obj.destructible = true;
		obj.backup = {};
		obj.forbbiden = ['yuimenu', 'yuimenubar', 'yui-nav', 'notips'];
		// public methods
		obj.config = function ( userConfig ) {
			c = userConfig || {};
			_defConf.constraintoviewport = ($L.isBoolean(c.constraintoviewport)?c.constraintoviewport:_defConf.constraintoviewport);
			_defConf.zIndex = ($L.isNumber(c.zIndex)?c.zIndex:_defConf.zIndex);
			_defConf.underlay = ($L.isString(c.underlay)?c.underlay:_defConf.underlay);
			_defConf.preventoverlap = ($L.isBoolean(c.preventoverlap)?c.preventoverlap:_defConf.preventoverlap);
			_defConf.width = ($L.isNumber(c.width)||$L.isString(c.width)?c.width:_defConf.width);
			_defConf.height = ($L.isNumber(c.height)||$L.isString(c.height)?c.height:_defConf.height);
			_defConf.close = ($L.isBoolean(c.close)?c.close:_defConf.close);
			_defConf.effect = ($L.isObject(c.effect)?c.effect:_defConf.effect);
			_defConf.opacity = ($L.isNumber(c.opacity)?c.opacity:_defConf.opacity);
			_defConf.showdelay = ($L.isNumber(c.showdelay)?c.showdelay:_defConf.showdelay);
		};
		/**
		 * @method init
		 * @description Initialization process (optional).
		 * @return void
		 */
		obj.init = function () {
			if (!_ready) {
				_ready = true;
				$B.on('rollover', actionControl);
			}
		};
		/**
		 * @method check
		 * @description Analyzing the event and the target
		 * @param {Event} 			e DOM Event
		 * @param {HTMLElement} 	el DOM Element
		 * @return void
		 */
		obj.check = function( e, el ) {
			this.init();
		    // Remove any existing mouseover/mouseout listeners from the old element and restoring the values
			if (this.element) {
	            $E.removeListener(this.element, "mouseout", obj.hide);
			}
			this.element = el;
			_save (); // saving values...
			_pos = $E.getXY(e); // computing the mouse position...
			// Add mouseover/mouseout listeners to context elements
            $E.addListener(obj.element, "mouseout", obj.dismiss, obj, true);
			// reseting the current values
			this.body = '';
		    this.header = null;
		    this.footer = null;
			if (!$L.isFunction(this.onCompile) || !(this.onCompile.apply ( obj, [this.element] ))) {
				this.compileBody ( el );
			}
			// verifing if we really have text to display in the tooltip
			if (($L.isString(this.body) && (this.body !== '')) || $L.isString(this.header) || $L.isString(this.footer)) {
			  // Eliminando todos los ATL de las imagenes que estan dentro del Anchor - for IE
			  try {
				var childs = el.getElementsByTagName("img");
				if (childs && (childs.length > 0)) {
				  for (var i=0; i<childs.length; i++) {
				    childs[i].alt = '';
				  }
			    }
			  } catch (e1) {}
			  // applying delay before show
			  obj.delay();
		    }
		};
		/**
		 * @method render
		 * @description Rendering the current tooltip.
		 * @return void
		 */
		obj.render = function () {
		    if ($L.isObject(this.handleOverlay) && (this.destructible)) {
			   this.handleOverlay.destroy();
			}
			this.destructible = true;
			if (!$L.isFunction(YAHOO.widget.Panel)) {
				return false;
			}
			// Build overlay based on markup
			this.handleOverlay = new YAHOO.widget.Panel(_handle, {
			  visible:false,
			  constraintoviewport:true,
			  zIndex: _defConf.zIndex,
			  underlay: _defConf.underlay,
			  preventoverlap: _defConf.preventoverlap,
			  width: _defConf.width,
			  close: _defConf.close,
			  context: this.element,
			  xy: [_pos[0]+10, _pos[1]+10]
			});
			$D.addClass (this.handleOverlay.element, _className);
			if (_defConf.close) { // if have close button, put the bar
			  this.handleOverlay.setHeader ( ' &nbsp; ' );
			  if ($L.isFunction(YAHOO.util.DD)) {
			  	this.handleOverlay.cfg.setProperty("dragable", true);
			  }
			}
			if (this.body) {
				this.handleOverlay.setBody (this.body);
			}
			if (this.header) {
				this.handleOverlay.setHeader (this.header);
			}
			if (this.footer) {
				this.handleOverlay.setFooter (this.footer);
			}
			if ($D.inDocument(_handle)) { // is the panel is already in the DOM
	            this.handleOverlay.render();
	        } else {
	            this.handleOverlay.render(document.body);
	        }
			if (_defConf.effect) {
				this.handleOverlay.cfg.setProperty('effect', _defConf.effect);
			}
			this.handleOverlay.showEvent.subscribe(function(){
			  obj.destructible = true;
			  // applying the correct opacity...
			  if (!$E.isIE || $B.force2alfa) {
			  	$D.setStyle(obj.handleOverlay.element, 'opacity', _defConf.opacity);
			  }
			}, obj, true);
			this.handleOverlay.hideEvent.subscribe(function(){ obj.destructible = true; }, obj, true);
			if ($L.isFunction(this.onRender)) {
				this.onRender.apply(obj, [this.element, this.handleOverlay]);
			}
			obj.show ();
		};
		/**
		 * @method dismiss
		 * @description Hiding the current tooltip
		 * @return void
		 */
		obj.dismiss = function () {
		    $E.removeListener(obj.element, "mouseout", obj.dismiss);
			window.clearTimeout(_timer);
		    window.clearTimeout(_delayTimer);
			_restore ();
			if (!_defConf.close) { // if don't have close button
			  obj.hide();
			}
		};
		/**
		 * @method delay
		 * @description Delay the tooltip show action few miliseconds
		 * @return void
		 */
		obj.delay = function () {
		   // applying the delay before show the tooltip...
		   window.clearTimeout(_timer);
		   window.clearTimeout(_delayTimer);
		   if (!this.destructible) {
			 if ($L.isObject(this.handleOverlay)) {
			   this.handleOverlay.hideEvent.subscribe(obj.delay, obj, true);
			   this.handleOverlay.showEvent.subscribe(obj.delay, obj, true);
			 }
		   }
		   else {
			   _delayTimer = window.setTimeout(function(){
		            obj.render ();
		        }, _defConf.showdelay);
		   }
		};
		/**
		 * @method show
		 * @description Show the current tooltip
		 * @return void
		 */
		obj.show = function () {
		  if (this.handleOverlay && this.element) {
		  	this.destructible = false;
		    this.handleOverlay.show();
			// setting the autodismis timer...
			if ($L.isNumber(_defConf.autodismissdelay) && (_defConf.autodismissdelay > 0)) {
			  window.clearTimeout(_timer);
			  _timer = window.setTimeout(function() {
				obj.dismiss();
			  }, Math.abs(_defConf.autodismissdelay));
			}
		  }
		};
		/**
		 * @method hide
		 * @description Hide the current tooltip
		 * @return void
		 */
		obj.hide = function () {
		  if ((this.handleOverlay) && (this.element)) {
			this.handleOverlay.hide();
		  }
		};
		/**
		 * @method compilePath
		 * @description Analyze a path 
		 * @param {String} uri   	url that should be analyzed
		 * @param {Number} limit 	maximum number of characters 
		 * @return {String}
		 */
		obj.compilePath = function ( uri, limit ) {
			return _generatePath(uri, limit);
		};
		/**
		 * @method compileBody
		 * @description Analyze a dom element, and build the body of the tooltip based on the title, access-key and title
		 * @param {Node} el 	DOM Element
		 * @return void
		 */
		obj.compileBody = function ( el ) {
			var path = this.compilePath( el.getAttribute('href',2) ),
				access = ( el.accessKey ? " ["+el.accessKey+"]" : "" ),
			 	tip = this.backup.title;
			tip = (tip?tip + '<br />' : '' );
			this.body = (tip+access+path !== ''?tip+'<em>'+access+'</em><strong>'+path+'</strong>':'');
		};
		/**
		 * @method finder
		 * @description Returns a node element that represent the first parent with the class yui-tip or null.
		 * @param {Node} el		DOM Element
		 * @return {Node}
		 */
		obj.finder = function ( el ) {
		    return $B.getOwnerByClassName( el, 'yui-tip' );
		};
		$E.onDOMReady(obj.init, obj, true);
		return obj;
	}();
})();
YAHOO.register("tooltips", YAHOO.widget.TooltipManager, {version: "@VERSION@", build: "@BUILD@"});
