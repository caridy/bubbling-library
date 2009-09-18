/**
 * The Lighter will monitoring the areas using the className value and will highlighting the yui-cms-item areas on mouseover.
 *
 * @namespace YAHOO.plugin
 * @module lighter
 * @requires yahoo
 * @requires event
 * @requires dom
 * @requires bubbling
 */
(function() {

    var $B = YAHOO.Bubbling,
		$E = YAHOO.util.Event,
		$L = YAHOO.lang,
	    $D = YAHOO.util.Dom;

	/**
	 * The Lighter Plugin
	 * @class Lighter
	 * @static
	 */
	YAHOO.plugin.Lighter = function() {
		var obj = {},
			_areas = {},
			_listClass = 'yui-cms-selector',
			_itemClass = 'yui-cms-item',
			_selector = 'selected',
			_defConf   = {
							persistent: false, // true if you want to keep an item selected even when the mouse is out of the area
							onReset: null,
							onSelect: null
						 };

		function reset (area, conf) {
			var resetItem = function ( ref ) {
					$D.removeClass(ref, _selector);
				},
				items = $D.getElementsByClassName(_itemClass,'*',area);
			if (items.length > 0) {
			  $D.batch (items, resetItem, obj, true);
			}
			if ($L.isFunction(conf.onReset)) {
				conf.onReset.apply ( conf, [area] );
			}
		}
		// pasive behavior...
		$B.on('rollover', function (layer, args) {
		  var area, item, onWayOut, conf = {}, id;
		  item = $B.getOwnerByClassName( args[1].target, _itemClass );
		  if (item && (area = $B.getOwnerByClassName( item, _listClass )) && !$D.hasClass(item, _selector)) {
		    // is over a new item...
			for (id in _areas) {
				if (_areas.hasOwnProperty(id) && $D.hasClass(area, id)) { // match with a preconfigured area
			        conf = _areas[id];
			    }
			}
			// defining the reset routine...
			if (!$D.hasClass(area, _selector)) {
				$D.addClass(area, _selector);
				onWayOut = function (e) {
				    if (!$B.virtualTarget(e, area)) {
				      reset(area, conf);
				    }
				};
				if (!conf.persistent) {
				    $E.removeListener ( area, 'mouseout', onWayOut );
					$E.addListener ( area, 'mouseout', onWayOut, obj, true );
				}
			}
			reset (area, conf);
			$D.addClass(item, _selector);
			if ($L.isFunction(conf.onSelect)) {
				conf.onSelect.apply ( conf, [item, area] );
			}
		  }
	    });

		/**
		* @method add
		* @description add new class to the monitoring list...
		* @public
		* @param {string} className
		* @param {object} conf        Configuration params for the areas with this classname
		* @return void
		*/
		obj.add = function ( className, conf ) {
			if ($L.isString(className) && (className !== '')) {
			  obj.remove(className);
			  _areas[className] = conf || _defConf;
			}
		};
		/**
		* @method remove
		* @description Remove a class from the monitoring list...
		* @public
		* @param {object} id	className
		* @return void
		*/
		obj.remove = function ( className ) {
			if ($L.isString(className) && (className !== '') && (_areas[className])) {
				_areas[className] = null; // discarding the area...
			}
			_areas[className] = null;
		};
		return obj;
	}();
})();
YAHOO.register("lighter", YAHOO.plugin.Lighter, {version: "@VERSION@", build: "@BUILD@"});
