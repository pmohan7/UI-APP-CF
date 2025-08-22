/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"te/gas/fi/report/comtefireport/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
