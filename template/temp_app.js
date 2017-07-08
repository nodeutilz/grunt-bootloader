define({
    name: "app",
    extend : "view",
    modules: ["jqrouter", "jQuery"]
}).as(function (APP, jqrouter, jQuery) {

    return {
        router: jqrouter.map({
            "/{{name}}/conig/*": "view.config",
            "/{{name}}/main": "main"
        }),
        events: {},
        _init_: function () {
            var self = this;
            jqrouter.start();
            _importStyle_("{{name}}/style");
            return this.$().loadTemplate(
                this.path("app.html")).done(function () {
                self.router();
                jQuery('body').removeClass("loadingPage");
            });
        },
        _routerEvents_: function (e, target, data, params) {
            var self = this;
            module([target],function(TargetModule){
                self.$("#MainModule").initView(TargetModule.instance(data));
            });
        },
        _ready_: function () {
            var ERROR = window.console.error;
            window.onerror = function () {
                ERROR.apply(window.console, arguments);
            };
            if (window.console && !bootloader.config().debug) {
                window.console.error = function () {
                    return window.console.warn.apply(window.console, arguments);
                };
            }
            jQuery("body").addView(this.instance());
        }
    };

});