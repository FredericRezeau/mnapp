// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Assets resolution enumeration.
    namespace.AssetResolutionEnum = { "ResolutionA": 0, "ResolutionB": 1, "ResolutionC": 2, "ResolutionD": 3, "ResolutionE": 4 };

    // Layout orientation enumeration.
    namespace.LayoutOrientationEnum = { "Landscape": 0, "Portrait": 1 };

    // Direction enumeration.
    namespace.DirectionEnum = { "None": 0, "Right": 1, "Left": 2, "Up": 3, "Down": 4 };

    // App state enumeration.
    namespace.AppStateEnum = { "PreLoading": 2, "Loading": 3, "Run": 4 };

    // Effect type enumeration.
    namespace.EffectTypeEnum = { "None": 0, "Floating": 1 };

    // Hud entity type enumeration.
    namespace.HudEntityTypeEnum = { "None": 0, "Title": 1, "MenuButton": 2, "InputBox": 3, "SearchButton": 4, "StarButton": 5, "ListButton": 6, "FavButton": 7, "NetworkPanel": 8 };

    // Page type enum.
    namespace.PageTypeEnum = { "None": 0, "AllMasternodes": 1, "MyMasternodes": 2 };

})(window.MNApp = window.MNApp || {});
