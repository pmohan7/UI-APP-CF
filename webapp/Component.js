sap.ui.define([
    "sap/ui/core/UIComponent",
    "te/gas/fi/report/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("te.gas.fi.report.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});