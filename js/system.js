// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Initialize the system.
    namespace.initializeSystem = function () {
    };

    // Play a sound.
    namespace.playSound = function (id) {
       AudioManager.playSound(id);
    };

    // Stop a sound.
    namespace.stopSound = function (id) {
        AudioManager.stopSound(id);
    };

})(window.MNApp = window.MNApp || {});
