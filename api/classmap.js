YAHOO.env.classMap = {"YAHOO.plugin.Lighter": "lighter", "YAHOO.plugin.WizardManager": "wizard", "YAHOO.widget.AccordionManager": "accordion", "YAHOO.plugin.Navigation": "navigation", "YAHOO.widget.Loading": "loading", "YAHOO.Bubbling": "bubbling", "YAHOO.widget.TooltipManager": "tooltipmanager", "YAHOO.plugin.Dispatcher": "dispatcher"};

YAHOO.env.resolveClass = function(className) {
    var a=className.split('.'), ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
