// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Precomputed offsets for tiles.
    var OFFSET0X, OFFSET1X, OFFSET2X, OFFSET3X, OFFSET4X, OFFSET5X, OFFSET6X, OFFSET7X, OFFSET8X, OFFSET9X, OFFSET10X;

    // Retrieve the scale unit ratio and precompute the tile offsets.
    namespace.computeTileOffsets = function () {
        var scaleUnit = namespace.getScaleUnit();
        var tileSize = (1 / scaleUnit);
        OFFSET0X = 0;
        OFFSET1X = tileSize * 1;
        OFFSET2X = tileSize * 2;
        OFFSET3X = tileSize * 3;
        OFFSET4X = tileSize * 4;
        OFFSET5X = tileSize * 5;
        OFFSET6X = tileSize * 6;
        OFFSET7X = tileSize * 7;
        OFFSET8X = tileSize * 8;
        OFFSET9X = tileSize * 9;
        OFFSET10X = tileSize * 10;
    };

    // Draw all.
    namespace.draw = function (context, sceneManager) {
        // Retrieve the app state and data for this frame.
        var currentAppState = namespace.getCurrentAppState();
        var canvasWidth = namespace.getCanvasWidth();
        var canvasHeight = namespace.getCanvasHeight();
        var orientation = namespace.getLayoutOrientation();

        context.save();

        // Draw the background.
        context.fillStyle = "rgb(166, 186, 197)";
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        if (currentAppState === namespace.AppStateEnum.Loading) {
            // Draw the loader.
            namespace.drawLoader(context);
        }
        else if (currentAppState === namespace.AppStateEnum.Run) {
            // Draw the hud.
            context.save();
            namespace.applyHudCameras();
            namespace.drawHud(context, sceneManager);
            context.restore();
        }

        context.restore();
    };

    // Draw the loader.
    namespace.drawLoader = function (context) {
        var isLandscape = (namespace.getLayoutOrientation() === namespace.LayoutOrientationEnum.Landscape);
        var size = namespace.screenToHud({ "x": namespace.getCanvasWidth(), "y": namespace.getCanvasHeight() });
        var appLoadingData = namespace.getLoadingData();
        var totalWidth = 4;
        var filledWidth = (appLoadingData.current * totalWidth / appLoadingData.total);

        // Apply the hud cameras to draw hud items.
        context.save();
        namespace.applyHudCameras();

        // Draw the progress.
        context.drawImage(namespace.Resources.art01, OFFSET5X, OFFSET7X, OFFSET4X, OFFSET1X, size.x / 2 - 2, size.y / 2, 4, 1);
        context.save();
        context.beginPath();
        context.rect(size.x / 2 - 2, size.y / 2, filledWidth, 1);
        context.closePath();
        context.clip();
        context.drawImage(namespace.Resources.art01, OFFSET5X, OFFSET8X, OFFSET4X, OFFSET1X, size.x / 2 - 2, size.y / 2, 4, 1);
        context.restore();

        // Draw the logo.
        context.drawImage(namespace.Resources.art01, OFFSET0X, OFFSET7X, OFFSET3X, OFFSET3X, size.x * 0.5 - 1.5, size.y * 0.5 - 2.6, 3, 3);
        context.restore();
    };

    // Draw the hud.
    namespace.drawHud = function (context, sceneManager) {
        var i;

        // Draw the page.
        context.save();
        context.translate(sceneManager.pageOffset, 0);
        namespace.roundRect(context, sceneManager.pageScroller.x, sceneManager.pageScroller.y, sceneManager.pageScroller.width, sceneManager.pageScroller.height, sceneManager.hudUnit * 0, "rgba(120, 105, 215, 0.7)");
        var fillColor = "rgba(255, 255, 255, 1)";
        namespace.roundRect(context, sceneManager.pageScroller.x, sceneManager.pageScroller.y, sceneManager.pageScroller.width, sceneManager.pageScroller.height, sceneManager.hudUnit * 0, fillColor);

        var clipOffsetY = 0;

        context.save();
        context.beginPath();
        context.rect(sceneManager.pageScroller.x, sceneManager.pageScroller.y + clipOffsetY, sceneManager.pageScroller.width, sceneManager.pageScroller.height - clipOffsetY);
        context.clip();

        // Draw the list items.
        context.save();
        context.translate(sceneManager.pageFadeInTime * sceneManager.size.y, -sceneManager.pageScroller.offset);

        if (sceneManager.pageScroller.items.length === 0 && sceneManager.pageType === namespace.PageTypeEnum.MyMasternodes) {
            context.drawImage(namespace.Resources.art01, OFFSET8X, OFFSET0X, OFFSET2X, OFFSET2X, sceneManager.pageScroller.x + sceneManager.pageScroller.width * 0.5 - sceneManager.hudUnit * 1.6, sceneManager.pageScroller.y + sceneManager.hudUnit * 2, sceneManager.hudUnit * 3.2, sceneManager.hudUnit * 3.2);
            context.textAlign = "center";
            namespace.drawText(context, sceneManager, sceneManager.pageScroller.x + sceneManager.pageScroller.width * 0.5, sceneManager.pageScroller.y + sceneManager.hudUnit * 6.5, "Your favorite masternode list is empty.", "rgb(110, 130, 150)", sceneManager.fontScale * 0.45);
        }

        namespace.notifCount = 0;
        for (var i = 0; i < sceneManager.pageScroller.items.length; i += 1) {
            var item = sceneManager.pageScroller.items[i];

            // Notifications.
            var oldCount = namespace.notifCount;
            if (item.star) {
                var rewards = sceneManager.rewards[item.address];
                if (rewards) {
                    for (var r = 0; r < rewards.length; r += 1) {
                        namespace.notifCount += 1;
                    }
                }
            }

            if (item.y - sceneManager.pageScroller.offset + item.height > sceneManager.pageScroller.y + clipOffsetY
                && item.y - sceneManager.pageScroller.offset - item.height < sceneManager.pageScroller.y + sceneManager.pageScroller.height) {

                context.save();


                namespace.roundRect(context, item.x, item.y, item.width, item.height, sceneManager.hudUnit * 0, (oldCount !== namespace.notifCount) ? "rgba(206, 231, 243, 1)" : ((item.star) ? "rgba(234, 242, 246, 1)" : "rgba(255, 255, 255, 1)"));
                namespace.roundRect(context, item.x, item.y + item.height * 0.99, item.width, item.height * 0.01, item.height * 0.005, "rgba(0, 0, 0, 0.2)");

                context.save();
                if (item.isStarDown) {
                    var scaleD = 0.95;
                    context.translate(item.x + item.width * 0.2, item.y + item.height * 0.5);
                    context.scale(scaleD, scaleD);
                    context.translate(-(item.x + item.width * 0.2), -(item.y + item.height * 0.5));
                }
                if (item.star) {
                    context.drawImage(namespace.Resources.art01, OFFSET6X, OFFSET0X, OFFSET2X, OFFSET2X, item.x + item.height * 0.125, item.y + item.height * 0.25, item.height * 0.45, item.height * 0.45);
                }
                else {
                    context.drawImage(namespace.Resources.art01, OFFSET4X, OFFSET0X, OFFSET2X, OFFSET2X, item.x + item.height * 0.125, item.y + item.height * 0.25, item.height * 0.45, item.height * 0.45);
                }
                context.restore();

                context.textAlign = "left";
                context.textBaseline = "top";
                namespace.drawText(context, sceneManager, item.x + item.height * 0.8, item.y + item.height * 0.05, item.ip, "rgb(0, 0, 0)", sceneManager.fontScale * 0.55);
                namespace.drawText(context, sceneManager, item.x + item.height * 0.8, item.y + item.height * 0.33, item.address, "rgb(136, 158, 162)", sceneManager.fontScale * 0.35);

                context.textAlign = "center";
                var color = (item.status === "ENABLED") ? "rgb(145, 180, 90)" : "rgb(190, 80, 80)";
                namespace.roundRect(context, item.x + item.height * 0.8, item.y + item.height * 0.515, item.height * 1, item.height * 0.2, sceneManager.hudUnit * 0.2, color);
                namespace.drawText(context, sceneManager, item.x + item.height * 0.8 + item.height * 0.5, item.y + item.height * 0.55, item.status, (item.star ? "rgb(241, 247, 168)" : "rgb(255, 255, 255)"), sceneManager.fontScale * 0.3);

                // Draw the reward notifications.
                if (item.star) {
                    var rewards = sceneManager.rewards[item.address];
                    if (rewards) {
                        var startX = item.x + item.height * 0.8 + item.height * 1.1;
                        for (var r = 0; r < Math.min(rewards.length, 5); r += 1) {
                            namespace.roundRect(context, startX, item.y + item.height * 0.515, item.height * 0.3, item.height * 0.2, sceneManager.hudUnit * 0.2, "rgb(28, 186, 237)");
                            namespace.drawText(context, sceneManager, startX + item.height * 0.15, item.y + item.height * 0.55, rewards[r].type, "rgb(255, 255, 255)", sceneManager.fontScale * 0.3);
                            startX += item.height * 0.35;
                        }
                    }
                }

                context.textAlign = "left";
                context.font = "40px Regular";
                namespace.drawText(context, sceneManager, item.x + item.height * 0.8, item.y + item.height * 0.8, item.time, "rgb(80, 85, 85)", sceneManager.fontScale * 0.3);

                context.save();
                if (item.isDown) {
                    var scaleD = 0.95;
                    context.translate(item.x + item.width * 0.8, item.y + item.height * 0.5);
                    context.scale(scaleD, scaleD);
                    context.translate(-(item.x + item.width * 0.8), -(item.y + item.height * 0.5));
                }

                if (item.url !== "") {
                    if (item.star) {
                        context.drawImage(namespace.Resources.art01, OFFSET2X, OFFSET2X, OFFSET2X, OFFSET2X, item.x + item.width - item.height * 0.58, item.y + item.height * 0.05, item.height * 0.46, item.height * 0.46);
                    }
                    else {
                        context.drawImage(namespace.Resources.art01, OFFSET0X, OFFSET2X, OFFSET2X, OFFSET2X, item.x + item.width - item.height * 0.58, item.y + item.height * 0.05, item.height * 0.46, item.height * 0.46);
                   }
                }
                context.restore();
                
                context.restore();
            }
        }

        context.restore();
        context.restore();
        context.restore();

        if (sceneManager.pageScroller.hasBar && (sceneManager.pageScroller.isDown || sceneManager.pageScroller.scrollTime)) {
            var alpha = context.globalAlpha;
            var limitedOffset = Math.max(0, Math.min(sceneManager.pageScroller.maxOffset, sceneManager.pageScroller.offset));
            var offset = limitedOffset * sceneManager.pageScroller.height / (sceneManager.pageScroller.maxOffset + sceneManager.pageScroller.height);
            context.globalAlpha = Math.min(1, sceneManager.pageScroller.scrollTime);
            namespace.roundRect(context, sceneManager.pageScroller.x - sceneManager.hudUnit * 0.5 + sceneManager.pageScroller.width, sceneManager.pageScroller.y, sceneManager.hudUnit * 0.5, sceneManager.pageScroller.height, sceneManager.hudUnit * 0.3, "rgba(0, 0, 0, 0.1)");
            namespace.roundRect(context, sceneManager.pageScroller.x - sceneManager.hudUnit * 0.5 + sceneManager.pageScroller.width, sceneManager.pageScroller.y + offset, sceneManager.hudUnit * 0.5, sceneManager.pageScroller.barSize, sceneManager.hudUnit * 0.3, "rgba(0, 0, 0, 0.3)");
            context.globalAlpha = alpha;
        }

        // Draw the hud entities.
        for (i = sceneManager.hudEntities.length - 1; i >= 0; i -= 1) {
            namespace.drawHudEntity(context, sceneManager.hudEntities[i], sceneManager);
        }

        // Draw the effects.
        for (i = 0; i < sceneManager.effects.length; i += 1) {
            namespace.drawEffect(context, sceneManager.effects[i], sceneManager);
        }
    };

    // Draw a scene entity.
    namespace.drawSceneEntity = function (context, entity, sceneManager) {
        var margin, cell;
        var x = entity.x;
        var y = entity.y;
        var offsetX = entity.size * 0.5;
        var offsetY = entity.size * 0.5;
        var rx = x - offsetX;
        var ry = y - offsetY;

        context.save();

        // Mirror.
        if (entity.direction === namespace.DirectionEnum.Left) {
            context.translate(entity.x * 2, 0);
            context.scale(-1, 1);
        }

        // Apply scaling.
        context.translate(entity.x, entity.y);
        context.scale((entity.scaleFactor), (entity.scaleFactor));
        context.translate(-entity.x, -entity.y);

        // Apply rotation.
        context.translate(entity.x, entity.y);
        context.rotate(entity.angle);
        context.translate(-entity.x, -entity.y);

        context.drawImage(namespace.Resources.art01, OFFSET0X, OFFSET0X, OFFSET1X, OFFSET1X, rx, ry, entity.size, entity.size);
    };

    // Draw an hud entity.
    namespace.drawHudEntity = function (context, entity, sceneManager) {
        var x = entity.x;
        var y = entity.y;
        var offsetX = entity.width * 0.5;
        var offsetY = entity.height * 0.5;
        var rx = x - offsetX;
        var ry = y - offsetY;

        context.save();

        // Mirror.
        if (entity.direction === namespace.DirectionEnum.Left) {
            context.translate(entity.x * 2, 0);
            context.scale(-1, 1);
        }

        var scale = (entity.selected) ? 0.92 : 1;
        if (entity.deselectTime) {
            scale += entity.heartBeats[1].time * Math.min(entity.height, entity.width) * 3 * entity.deselectTime;
        }

        if (entity.type === namespace.HudEntityTypeEnum.MenuButton ||
            entity.type === namespace.HudEntityTypeEnum.SearchButton ||
            entity.type === namespace.HudEntityTypeEnum.StarButton) {
            scale *= 0.8;
        }

        if (entity.type === namespace.HudEntityTypeEnum.ListButton ||
            entity.type === namespace.HudEntityTypeEnum.FavButton) {
            scale *= 0.93;
        }

        if (entity.type === namespace.HudEntityTypeEnum.ListButton) {
            namespace.roundRect(context, rx, ry - sceneManager.hudUnit, entity.width + entity.width, entity.height * 2.4, sceneManager.hudUnit * 0.4, "rgb(166, 186, 197)", false, sceneManager);
        }

        // Apply scaling.
        context.translate(entity.x, entity.y);
        context.scale(entity.scaleFactor * scale, entity.scaleFactor * scale);
        context.translate(-entity.x, -entity.y);

        // Apply rotation.
        context.translate(entity.x, entity.y);
        context.rotate(entity.angle);
        context.translate(-entity.x, -entity.y);

        switch (entity.type) {
            case namespace.HudEntityTypeEnum.Title:
                context.drawImage(namespace.Resources.logoImg, rx, ry, entity.width, entity.height);
                break;
            case namespace.HudEntityTypeEnum.MenuButton:
                context.drawImage(namespace.Resources.art01, OFFSET0X, OFFSET0X, OFFSET2X, OFFSET2X, rx, ry, entity.width, entity.height);
                break;
            case namespace.HudEntityTypeEnum.SearchButton:
                context.globalAlpha = entity.enabled? 1 : sceneManager.searchModeTime * 2;
                context.drawImage(namespace.Resources.art01, OFFSET2X, OFFSET0X, OFFSET2X, OFFSET2X, rx, ry, entity.width, entity.height);
                break;
            case namespace.HudEntityTypeEnum.StarButton:
                context.globalAlpha = entity.enabled ? 1 : sceneManager.searchModeTime * 2;
                context.drawImage(namespace.Resources.art01, (sceneManager.pageType === namespace.PageTypeEnum.MyMasternodes) ? OFFSET4X : OFFSET8X, (sceneManager.pageType === namespace.PageTypeEnum.MyMasternodes) ? OFFSET2X : OFFSET0X, OFFSET2X, OFFSET2X, rx, ry, entity.width, entity.height);

                if (namespace.notifCount > 0) {
                    namespace.roundRect(context, rx + entity.height * 0.7, ry + entity.height * 0.7, entity.height * 0.42, entity.height * 0.42, entity.height * 0.1, "rgb(240, 70, 70)", true, sceneManager);
                    namespace.drawText(context, sceneManager, rx + entity.height * 0.9, ry + entity.height * 0.9, ((namespace.notifCount < 10) ? namespace.notifCount : "*"), "rgb(255, 255, 255)", sceneManager.fontScale * 0.4);
                }
                break;
            case namespace.HudEntityTypeEnum.ListButton:
                namespace.roundRect(context, rx, ry, entity.width, entity.height, entity.height * 0.1, "rgb(166, 186, 197)", true, sceneManager);

                context.textAlign = "left";
                namespace.drawText(context, sceneManager, rx + entity.height * 0.8, ry + entity.height * 0.5, "NETWORK", "rgb(80, 85, 85)", sceneManager.fontScale * 0.5);
                context.drawImage(namespace.Resources.art01, OFFSET5X, OFFSET9X, OFFSET1X, OFFSET1X, rx + entity.height * 0.05, ry + entity.height * 0.15, entity.height * 0.6, entity.height * 0.6);
                break;
            case namespace.HudEntityTypeEnum.FavButton:
                namespace.roundRect(context, rx, ry, entity.width, entity.height, entity.height * 0.1, "rgb(166, 186, 197)", true, sceneManager);
                context.textAlign = "left";
                namespace.drawText(context, sceneManager, rx + entity.height * 0.8, ry + entity.height * 0.5, "FAVORITES", "rgb(80, 85, 85)", sceneManager.fontScale * 0.5);
                context.drawImage(namespace.Resources.art01, (sceneManager.pageType === namespace.PageTypeEnum.MyMasternodes) ? OFFSET4X : OFFSET8X, (sceneManager.pageType === namespace.PageTypeEnum.MyMasternodes) ? OFFSET2X : OFFSET0X, OFFSET2X, OFFSET2X, rx + entity.height * 0.05, ry + entity.height * 0.15, entity.height * 0.6, entity.height * 0.6);
                break;
            case namespace.HudEntityTypeEnum.NetworkPanel:
                var margin = ry * 0.05;
                var statsOffset = margin * 5;

                namespace.roundRect(context, rx, ry, entity.width, entity.height, 0, "rgb(122, 139, 143)", false, sceneManager);

                namespace.roundRect(context, rx + margin * 2, ry + margin * 11 + statsOffset, entity.width - margin * 4, margin * 17.2, margin, "rgb(110, 130, 133)", true, sceneManager);
                namespace.roundRect(context, rx + margin * 2, ry + margin * 32 + statsOffset, entity.width - margin * 4, margin * 48, margin, "rgb(110, 130, 133)", true, sceneManager);
                namespace.roundRect(context, rx + margin * 2, ry + margin * 84 + statsOffset, entity.width - margin * 4, margin * 48, margin, "rgb(110, 130, 133)", true, sceneManager);

                context.textBaseline = "top";
                context.font = "bold 40px Regular";
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 1 + statsOffset, "MAGNET NETWORK", "rgb(255, 255, 255)", sceneManager.fontScale * 0.5);
                context.drawImage(namespace.Resources.art01, OFFSET5X, OFFSET9X, OFFSET1X, OFFSET1X, rx + entity.width * 0.5 - margin * 35, ry + margin * 4, margin * 8, margin * 8);

                context.textAlign = "center";
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 19.6 + statsOffset, sceneManager.masternodes.length.toString(), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 41.6 + statsOffset, sceneManager.masternodestats.dailyAverage.toFixed(5), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 55.6 + statsOffset, sceneManager.masternodestats.dailyMin.toFixed(5), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 69.6 + statsOffset, sceneManager.masternodestats.dailyMax.toFixed(5), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);

                context.textAlign = "center";
                context.font = "40px Regular";
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 14 + statsOffset, "Total Masternodes", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 36 + statsOffset, "Daily Average", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 50 + statsOffset, "Daily Minimum", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 64 + statsOffset, "Daily Maximum", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);

                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 134 + statsOffset, "Estimates based on previous day historical data.", "rgb(209, 224, 228)", sceneManager.fontScale * 0.35);
                context.textAlign = "left";
                namespace.drawText(context, sceneManager, rx + margin * 3, ry + margin * 33 + statsOffset, "MAG", "rgb(209, 224, 228)", sceneManager.fontScale * 0.35);

                var newOffset = margin * 52;
                context.textAlign = "center";
                context.font = "bold 40px Regular";
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 41.6 + statsOffset + newOffset, "$" + (sceneManager.masternodestats.dailyAverage * sceneManager.masternodestats.usd).toFixed(3), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 55.6 + statsOffset + newOffset, "$" + (sceneManager.masternodestats.dailyMin * sceneManager.masternodestats.usd).toFixed(3), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 69.6 + statsOffset + newOffset, "$" + (sceneManager.masternodestats.dailyMax * sceneManager.masternodestats.usd).toFixed(3), "rgb(255, 255, 255)", sceneManager.fontScale * 0.6);

                context.textAlign = "center";
                context.font = "40px Regular";
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 36 + statsOffset + newOffset, "Daily Average", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 50 + statsOffset + newOffset, "Daily Minimum", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);
                namespace.drawText(context, sceneManager, rx + entity.width * 0.5, ry + margin * 64 + statsOffset + newOffset, "Daily Maximum", "rgb(209, 224, 228)", sceneManager.fontScale * 0.5);

                context.textAlign = "left";
                namespace.drawText(context, sceneManager, rx + margin * 3, ry + margin * 33 + statsOffset + newOffset, "USD", "rgb(209, 224, 228)", sceneManager.fontScale * 0.35);
                break;
            case namespace.HudEntityTypeEnum.InputBox:
                break;
        }

        context.restore();
    };

    // Draw the effect.
    namespace.drawEffect = function (context, effect, sceneManager) {
        context.save();

        // Alpha.
        if (effect.selfDestroyTime < effect.startFadeTime) {
            context.globalAlpha = effect.selfDestroyTime;
        }

        // Mirror.
        if (effect.direction === namespace.DirectionEnum.Left) {
            context.translate(effect.x * 2, 0);
            context.scale(-1, 1);
        }

        var offsetY = 0;
        var time = 0;
        if (effect.type === namespace.EffectTypeEnum.Hammer) {
            time = effect.selfDestroyTime - 1;
            offsetY = effect.acc * time * effect.radius;
        }

        // Apply scaling.
        context.translate(effect.x, effect.y - offsetY);
        context.scale(effect.scaleFactor + effect.scaleTime, effect.scaleFactor + effect.scaleTime);
        context.translate(-effect.x, -(effect.y - offsetY));

        // Apply rotation.
        context.translate(effect.x, effect.y - offsetY);
        context.rotate(effect.angle);
        context.translate(-effect.x, -(effect.y - offsetY));

        // Draw the effect.
        switch (effect.type) {
            case namespace.EffectTypeEnum.Floating:
                context.drawImage(namespace.Resources.art01, OFFSET4X, OFFSET2X, OFFSET2X, OFFSET2X, effect.x - effect.radius, effect.y - effect.radius, effect.radius * 2, effect.radius * 2);
                break;
        }

        context.globalAlpha = 1;

        context.restore();
    };

    // Draw text.
    namespace.drawText = function (context, sceneManager, x, y, text, color, scale) {
        if (!scale) {
            scale = sceneManager.fontScale;
        }
        context.save();
        context.translate(x, y);
        context.scale(scale, scale);
        context.translate(-x, -y);
        context.fillStyle = color;
        context.fillText(text, x, y);
        context.restore();
    }

    // Draw a number.
    namespace.drawNumber = function (context, number, x, y, width, height, scale, sceneManager) {
        var i, len, char, posX, posY, offset, image = namespace.Resources.art02;
        var maxChars = number.length;
        var charSize = Math.min((width + (width * 0.4)) / maxChars, height);
        var centerX = x + width * 0.5;
        var centerY = y + height * 0.5;

        context.save();
        context.translate(centerX, centerY);
        context.scale(scale, scale);
        context.translate(-centerX, -centerY);

        context.fillStyle = "rgba(255, 0, 0, 0.7)";
        posX = centerX - charSize * 0.6 * maxChars * 0.5 - charSize * 0.3;
        posY = y + ((charSize < height) ? (height - charSize) * 0.5 : 0);

        for (i = 0, len = number.length; i < len; i += 1) {
            char = number.charAt(i);
            context.drawImage(image, OFFSET1X * namespace.fontMap[char][1], OFFSET1X * namespace.fontMap[char][0], OFFSET1X, OFFSET1X, posX, posY, charSize * 0.97, charSize * 0.97);
            posX += charSize * 0.6;
        }

        context.restore();
    };

    // Draw a round rect.
    namespace.roundRect = function (context, x, y, w, h, r, color, strike, sceneManager) {
        context.save();
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        context.beginPath();
        context.moveTo(x + r, y);
        context.arcTo(x + w, y, x + w, y + h, r);
        context.arcTo(x + w, y + h, x, y + h, r);
        context.arcTo(x, y + h, x, y, r);
        context.arcTo(x, y, x + w, y, r);
        context.fillStyle = color;
        context.fill();
        if (strike) {
            context.lineWidth = sceneManager.hudUnit * 0.06;
            context.strokeStyle = "rgba(255,255, 255, 0.5)";
            context.stroke();
        }
        context.restore();
    };

})(window.MNApp = window.MNApp || {});
