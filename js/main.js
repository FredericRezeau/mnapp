// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

$(document).ready(function () {
    "use strict";

    $("#searchbox").on("focus", function () {
        this.select();
        MNApp.setSearch(true);
    });

    $("#searchbox").on("input", function () {
        MNApp.setFilter($("#searchbox").val());
    });

    $("#searchbox").on("blur", function () {
        MNApp.setSearch(false);
    });

    MNApp.openUrl = function (url) {
        window.open(url, "_blank");
    };

    // Handle UI update for HTML elements.
    MNApp.onUIUpdate = function (data) {
        if (data.searchBox) {
            $("#searchbox").width(data.searchBox.width).height(data.searchBox.height);
            $("#searchbox").css({ transform: data.searchBox.matrix });
            $("#searchbox").css("fontSize", 26);
            $("#searchbox").fadeIn();
        }
        else {
            $("#searchbox").fadeOut();
        }
    };

    // Handle back button pressed.
    window.onBackButtonPressed = function () {
        return MNApp.onBackButtonPressed();
    };

    MNApp.Resources.logoImg = new Image();
    MNApp.Resources.logoImg.src = "logo.png";

    MNApp.initialize();
});

$(window).resize(function () {
    "use strict";
    MNApp.resetDisplay();
});

// Prevent scrolling when moving.
$(document).on("touchmove", function (e) {
    "use strict";
    e.preventDefault();
});

// Provides requestAnimationFrame in a cross browser way. @author paulirish / http://paulirish.com/
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
        "use strict";
        return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();
}

