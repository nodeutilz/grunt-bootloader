define({
    name: "main",
    extend: "view",
    modules: ["jqrouter", "jQuery"]
}).as(function (app, jqrouter, jQuery) {

    return {
        events: {},
        _init_: function () {
            return this.$().loadTemplate(
                this.path("main.html"), {
                    fName: "Developer"
                }).done(function () {
            });
        }
    };

});