// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Resolution dependent variables.
    var resolutionX,
        resolutionY,
        scaleUnit,
        assetsSubFolder;

    // Variables.
    var layoutOrientation,  // Layout Orientation.
        optimalRatioX,      // Optimal ratio on X.
        optimalRatioY,      // Optimal ratio on Y.
        canvas,             // Canvas.
        context,            // 2D context.
        currentAppState,    // Current App state.
        lastUpdateTime,     // Last update time for the loop.
        sceneManager,       // Scene manager.
        unitCamera,         // Unit scaling camera applying the meter per pixel ratio.
        primaryCamera,      // The primary camera holds the translate transformation matrix.
        secondaryCamera,    // The secondary camera holds the rotation and scaling transformation matrix.
        hudCamera,          // Stand-alone camera for hud elements.
        cameraTarget,       // Current camera target position.
        cameraTargetZoom,   // Camera target zoom level.
        cameraBaseSpeed,    // Camera translation speed.
        cameraRotationSpeed,// Camera rotation speed.
        cameraZoomSpeed,    // Camera zoom speed.
        cameraZoomOutSpeed, // Camera zoom out speed.
        cameraTargetAngle,  // Camera target angle.
        cameraZoomOutTime,  // Time the camera should zoom out.
        cameraShakingTime,  // Camera shaking time.
        cameraSmallZoom,    // Camera is zooming out slightly.
        appLoaded,          // Ready.
        appLoadingData,     // Loading data.
        pointerStartPos,    // Pointer start position.
        introTime,          // Minimum intro time.
        cameraSpeedX3,      // Triple camera speed.
        isPointerDown;      // Pointer is down.

    // Scene animation heartbeats.
    var heartBeats = [
        { "time": 0, "direction": 0, "maxTime": 0.2, "speed1": 2, "speed2": 2 },        // Camera shakes.
        { "time": 0, "direction": 0, "maxTime": 1, "speed1": 2, "speed2": 4 },        // Heartbeat 1.
        { "time": 0, "direction": 0, "maxTime": 1, "speed1": 1, "speed2": 2 }          // Heartbeat 2.
    ];

    // Accessors.
    namespace.getScaleUnit = function () { return scaleUnit; };
    namespace.getCurrentAppState = function () { return currentAppState; };
    namespace.getCanvasWidth = function () { return canvas.width; };
    namespace.getCanvasHeight = function () { return canvas.height; };
    namespace.getLoadingData = function () { return appLoadingData; };
    namespace.getLayoutOrientation = function () { return layoutOrientation; };
    namespace.getOptimalRatio = function () { return { "x": optimalRatioX, "y": optimalRatioY }; };
    namespace.getCameraShakingTime = function () { return cameraShakingTime };
    namespace.getTitleHeartbeat1 = function () { return heartBeats[1]; };
    namespace.getTitleHeartbeat2 = function () { return heartBeats[2]; };

    // Apply the HUD cameras to the context.
    namespace.applyHudCameras = function () {
        context.setTransform.apply(context, unitCamera.matrix);
        context.transform.apply(context, hudCamera.matrix);
    };

    // Apply the scene cameras to the context.
    namespace.applySceneCameras = function () {
        context.setTransform.apply(context, unitCamera.matrix);
        context.transform.apply(context, primaryCamera.matrix);
        context.transform.apply(context, secondaryCamera.matrix);
    };

    // Apply the scene near parallax cameras.
    namespace.applyVeryVeryFarParallaxCameras = function () {
        context.translate(-secondaryCamera.x * 0.1, -secondaryCamera.y * 0.1);
    };

    // Apply the scene far parallax cameras.
    namespace.applyVeryFarParallaxCameras = function () {
        context.translate(-secondaryCamera.x * 0.4, -secondaryCamera.y * 0.3);
    };

    // Apply the scene near parallax cameras.
    namespace.applyFarParallaxCameras = function () {
        context.translate(-secondaryCamera.x * 0.7, -secondaryCamera.y * 0.7);
    };

    // Apply the scene near parallax cameras.
    namespace.applyNearParallaxCameras = function () {
        context.translate(-secondaryCamera.x * 1.7, -secondaryCamera.y * 1.7);
    };

    // Apply the scene 'here' parallax cameras.
    namespace.applyHereParallaxCameras = function () {
        context.translate(-secondaryCamera.x, -secondaryCamera.y);
    };

    // Project the point from HUD coordinates to Screen coordinates.
    namespace.sceneToScreen = function (point) {
        var camera = new namespace.Camera();
        camera.multiply(unitCamera);
        camera.multiply(primaryCamera);
        camera.multiply(secondaryCamera);
        camera.translate(-secondaryCamera.x, -secondaryCamera.y);
        return camera.cameraToScreen(point.x, point.y);
    };

    // Project the point from HUD coordinates to Screen coordinates.
    namespace.hudToScreen = function (point) {
        var camera = new namespace.Camera();
        camera.multiply(unitCamera);
        camera.multiply(hudCamera);
        return camera.cameraToScreen(point.x, point.y);
    };

    // Project the point from screen coordinates to HUD coordinates.
    namespace.screenToHud = function (point) {
        var camera = new namespace.Camera();
        camera.multiply(unitCamera);
        camera.multiply(hudCamera);
        return camera.screenToCamera(point.x, point.y);
    };

    // Project the point from screen coordinates to scene coordinates.
    namespace.screenToScene = function (point) {
        var camera = new namespace.Camera();
        camera.multiply(unitCamera);
        camera.multiply(primaryCamera);
        camera.multiply(secondaryCamera);
        camera.translate(-secondaryCamera.x, -secondaryCamera.y);
        return camera.screenToCamera(point.x, point.y);
    };

    // Initialize the app.
    namespace.initialize = function () {

        introTime = 1;
        cameraSpeedX3 = 0;

        // Initialize the system first.
        namespace.initializeSystem();

        // Reset the camera defauls parameters.
        resetCameraDefaults();

        appLoaded = false;
        isPointerDown = false;
        appLoadingData = { "current": 0, "total": 0 };

        // Determine assets resolution.
        var assets = categorizr.isDesktop ? namespace.AssetResolutionEnum.ResolutionA : namespace.AssetResolutionEnum.ResolutionB;
        switch (assets) {
            case namespace.AssetResolutionEnum.ResolutionA:
                scaleUnit = 1 / 128;
                assetsSubFolder = "1280";
                break;
            case namespace.AssetResolutionEnum.ResolutionB:
                scaleUnit = 1 / 128;
                assetsSubFolder = "1280";
                break;
        }

        // Pre-compute the offsets for tiles rendering.
        namespace.computeTileOffsets();

        // Initialize the canvas and retrieve the 2d context.
        canvas = document.getElementById("canvas");
        context = canvas.getContext("2d");

        // Bind the canvas events.
        $("#canvas").bind("vmousedown", pointerDown);
        $("#canvas").bind("vmouseup", pointerUp);
        $("#canvas").bind("vmousemove", pointerMove);

        // Create the cameras.
        unitCamera = new namespace.Camera();
        primaryCamera = new namespace.Camera();
        secondaryCamera = new namespace.Camera();
        hudCamera = new namespace.Camera();

        // Setup the hud camera.
        hudCamera.sx = 1;
        hudCamera.sy = 1;
        hudCamera.update();

        // Setup the display resolution.
        namespace.resetDisplay();

        // Load the loading screen resources.
        namespace.Resources.loaderImage = new Image();
        namespace.Resources.loaderImage.onload = onLoadingScreenReady;
        namespace.Resources.loaderImage.src = "assets/img/" + assetsSubFolder + "/art01.png";

        currentAppState = namespace.AppStateEnum.PreLoading;

        // Start the app loop.
        runApp();
    };

    // Resize hud items.
    namespace.resize = function () {
        if (sceneManager) {
            sceneManager.resize(canvas.width, canvas.height);
            cameraSpeedX3 = 0.7;
        }
    };

    // Reset the app display.
    namespace.resetDisplay = function () {
        var scaleX, scaleY, tileSize = (1 / scaleUnit);

        // Setup the layout orientation.
        layoutOrientation = ($(window).width() >= $(window).height()) ? namespace.LayoutOrientationEnum.Landscape : namespace.LayoutOrientationEnum.Portrait;

        // Reset the canvas buffer dimensions to resolution.
        if (canvas) {
            canvas.width = (layoutOrientation === namespace.LayoutOrientationEnum.Landscape) ? tileSize * 14 : tileSize * 8;
            canvas.height = (layoutOrientation === namespace.LayoutOrientationEnum.Landscape) ? (tileSize * 14 * $(window).height() / $(window).width()) : (tileSize * 8 * $(window).height() / $(window).width());

            optimalRatioX = $(window).width() / canvas.width;
            optimalRatioY = $(window).height() / canvas.height;

            // Adjust the canvas size.
            canvas.style.width = $(window).width() + "px";
            canvas.style.height = $(window).height() + "px";

            // Reset the unit camera.
            if (unitCamera) {
                unitCamera.sx = 1 / scaleUnit;
                unitCamera.sy = 1 / scaleUnit;
                unitCamera.update();
            }

            namespace.resize();
        }
    };

    // Reset default camera values.
    function resetCameraDefaults() {
        cameraBaseSpeed = 5;
        cameraRotationSpeed = 5.3;
        cameraZoomSpeed = 6;
        cameraZoomOutSpeed = 6;
        cameraZoomOutTime = 0;
        cameraShakingTime = 0;
    }

    // Shake the camera.
    function shakeCamera() {
        cameraShakingTime = 1;
    }

    // Zoom the camera.
    function zoomCamera() {
        cameraZoomOutTime = 0.18;
    }

    // Handle loading screen ready event.
    function onLoadingScreenReady() {
        var soundId, imageId;

        // Display the app load progress.
        currentAppState = namespace.AppStateEnum.Loading;

        // Finally, preload the app assets.
        var manifest = [];

        // Add the image resources.
        for (imageId in namespace.imageItems) {
            if (namespace.imageItems.hasOwnProperty(imageId)) {
                manifest.push({ "type": "img", "id": imageId, "src": "assets/img/" + +assetsSubFolder + "/" + namespace.imageItems[imageId] });
            }
        }

        // Add the sound resources.
        for (soundId in namespace.soundItems) {
            if (namespace.soundItems.hasOwnProperty(soundId)) {
                manifest.push({ "type": "snd", "id": soundId, "src": "assets/sound/" + namespace.soundItems[soundId] });
            }
        }

        namespace.loadResources(manifest, onAppLoaded, onLoadStep);
    }

    // Handle assets loading.
    function onLoadStep(currentStep, totalSteps) {
        appLoadingData = { "current": currentStep, "total": totalSteps };
    }

    // Handle the app loaded event.
    function onAppLoaded(images) {

        // Retrieve the preloaded assets.
        for (var image in images) {
            if (images.hasOwnProperty(image)) {
                namespace.Resources[image] = images[image];
            }
        }

        if (introTime > 0) {
            setTimeout(function () {
                appLoaded = true;
            }, introTime * 1000);
        }
        else {
            appLoaded = true;
        }
    }

    // Run App.
    function runApp() {
        // Calculate the elapsed time since previous frame.
        var now = new Date().getTime(), elapsed = Math.min((now - (lastUpdateTime || now)) / 1000, 0.05), normalElapsed = elapsed;
        lastUpdateTime = now;

        // Request the next animation frame.
        window.requestAnimationFrame(runApp);

        // Update the frame.
        update(elapsed, normalElapsed);

        // Reset the context to identity matrix and clear.
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Set the base font.
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 40px Regular";

        namespace.draw(context, sceneManager);
    }

    // Create the scene.
    function createScene() {
        // Create a new scene manager.
        sceneManager = new namespace.SceneManager();
        loadScene();

        // Ready to run.
        currentAppState = namespace.AppStateEnum.Run;
    }

    // Get the camera default target.
    function getCameraTarget() {
        // Retrieve the size of the screen projected to scene.
        var size, zoomX = 1, zoomY = 1, camera = new namespace.Camera();
        var height = sceneManager.height;
        var width = sceneManager.width;
        var margin = sceneManager.hudUnit * 5;
        var factor = 0.79;
        camera.multiply(unitCamera);
        size = camera.screenToCamera(canvas.width, canvas.height);

        // Compute the minimum zoom level needed to fit all.
        switch (layoutOrientation) {
            case namespace.LayoutOrientationEnum.Landscape:
                zoomY = size.y / (height + margin);
                zoomX = size.x / (width + margin);
                factor = 1;
                break;
            case namespace.LayoutOrientationEnum.Portrait:
                zoomY = size.y / (height + margin * 0);
                zoomX = size.x / (width + margin * 0);
                factor = 1;
                break;
        }

        // Center the camera on screen.
        var x = sceneManager.minX + width * 0.5;
        var y = sceneManager.minY + height * 0.5;
        return { "x": x, "y": y, "zoom": Math.min(zoomX, zoomY) * factor };
    }

    // Update all.
    function update(elapsed, normalElapsed) {
        var i, len, heartbeat;

        if (introTime > 0) {
            introTime -= elapsed;
            if (introTime < 0) {
                introTime = 0;
            }
        }

        if (cameraSpeedX3 > 0) {
            cameraSpeedX3 -= elapsed;
            if (cameraSpeedX3 < 0) {
                cameraSpeedX3 = 0;
            }
        }

        // Update the app animation heart beats.
        for (i = 0, len = heartBeats.length; i < len; i += 1) {
            heartbeat = heartBeats[i];
            if (heartbeat.direction === 0 && heartbeat.time <= heartbeat.maxTime) {
                heartbeat.time = Math.min(heartbeat.time + normalElapsed * heartbeat.speed1, heartbeat.maxTime);
                if (heartbeat.time === heartbeat.maxTime) {
                    heartbeat.direction = 1;
                }
            }
            else if (heartbeat.direction === 1 && heartbeat.time >= 0) {
                heartbeat.time = Math.max(heartbeat.time - normalElapsed * heartbeat.speed2, 0);
                if (heartbeat.time === 0) {
                    heartbeat.direction = 0;
                }
            }
        }

        if (cameraZoomOutTime > 0) {
            cameraZoomOutTime -= elapsed;
            if (cameraZoomOutTime < 0) {
                cameraZoomOutTime = 0;
            }
        }

        if (cameraShakingTime > 0) {
            cameraShakingTime -= elapsed;
            if (cameraShakingTime < 0) {
                cameraShakingTime = 0;
            }
        }

        if (appLoaded) {
            if (currentAppState === namespace.AppStateEnum.Loading) {
                createScene();
            }
            else if (currentAppState === namespace.AppStateEnum.Run) {

                // Update the scene manager.
                sceneManager.update(elapsed, normalElapsed);

                // Update the effects.
                updateEffects(elapsed);

                // Update the running app.
                updateRun(elapsed);

                if (sceneManager.shakeCamera) {
                    sceneManager.shakeCamera = false;
                    shakeCamera();
                }

                if (sceneManager.zoomCamera) {
                    sceneManager.zoomCamera = false;
                    zoomCamera();
                }

                // Update the cameras.
                updateCameras(elapsed, normalElapsed, cameraTarget);
            }
        }
    }

    // Update app running state.
    function updateRun(elapsed) {
        var i, target = getCameraTarget();

        // Update the camera target.
        cameraTargetAngle = 0;
        cameraTargetZoom = target.zoom;
        cameraTarget = { "x": target.x, "y": target.y };
    }

    // Update the effects.
    function updateEffects(elapsed) {
        var i, u, v, effect, effect1, effect2, distance, newEffects = [];

        // Update the effects.
        for (i = 0; i < sceneManager.effects.length;) {
            effect = sceneManager.effects[i];

            // Process effects with target.
            if (effect.target && !effect.cooldown) {
                distance = namespace.distance(effect.x, effect.y, effect.target.x, effect.target.y);
                effect.vx = (effect.target.x - effect.x) / distance * effect.speed;
                effect.vy = (effect.target.y - effect.y) / distance * effect.speed;
                effect.acc += elapsed * 15;
            }

            effect.update(elapsed);

            // Post update.
            if (effect.target && !effect.cooldown) {
                if (distance < namespace.distance(effect.x, effect.y, effect.target.x, effect.target.y)) {
                    effect.selfDestroyTime = 0;
                    effect.target.hasLoot = true;
                    effect.target.hammerCount = 0;
                }
            }

            // Self destroyable effect.
            if (effect.selfDestroyTime === 0) {
                sceneManager.effects.splice(i, 1);
                continue;
            }

            i += 1;
        }

        // Add the new effects.
        for (i = 0; i < newEffects.length; ++i) {
            sceneManager.effects.push(newEffects[i]);
        }
    }

    // Update the cameras.
    function updateCameras(elapsed, normalElapsed, target) {
        // Reset the translation.
        var x = primaryCamera.x, y = primaryCamera.y;
        primaryCamera.x = 0;
        primaryCamera.y = 0;
        primaryCamera.update();

        // Position the target at the center of the canvas.
        var camera = new namespace.Camera();
        camera.multiply(unitCamera);
        var size = camera.screenToCamera(canvas.width, canvas.height);
        primaryCamera.tx = size.x / 2 - target.x;
        primaryCamera.ty = size.y / 2 - target.y;

        var modifier = 0;
        if (sceneManager && sceneManager.mapModeTime > 0) {
            modifier = sceneManager.mapModeTime * 8;
        }

        // Determine the distance between current and target positions.
        var distance = namespace.distance(x, y, primaryCamera.tx, primaryCamera.ty);
        if (Math.abs(distance) > 0.001) {
            // Interpolation factors on x and y.
            var factorX = (primaryCamera.tx - x) / distance;
            var factorY = (primaryCamera.ty - y) / distance;

            // Camera speed is adjusted based on how far it is from the target.
            var cameraSpeedX = elapsed * distance * (3 - modifier) * cameraBaseSpeed * (cameraSpeedX3 > 0 ? 5 : 1);
            var cameraSpeedY = elapsed * distance * (3 - modifier) * cameraBaseSpeed * (cameraSpeedX3 > 0 ? 5 : 1);
            x += cameraSpeedX * factorX;
            y += cameraSpeedY * factorY;
        }
        else {
            x = primaryCamera.tx;
            y = primaryCamera.ty;
        }

        // Translation on primary camera.
        primaryCamera.x = x;
        primaryCamera.y = y;

        // Rotation and scaling on secondary camera.
        secondaryCamera.x = size.x / 2 - x;
        secondaryCamera.y = size.y / 2 - y;

        var zoomSpeed = cameraZoomSpeed;
        if (cameraZoomOutTime > 0) {
            cameraTargetZoom *= 0.7;
            zoomSpeed = cameraZoomOutSpeed;
        }

        // Zoom.
        if (secondaryCamera.sx > cameraTargetZoom) {
            secondaryCamera.sx -= zoomSpeed * normalElapsed;
            if (secondaryCamera.sx < cameraTargetZoom) {
                secondaryCamera.sx = cameraTargetZoom;
            }
        }
        if (secondaryCamera.sx < cameraTargetZoom) {
            secondaryCamera.sx += zoomSpeed * normalElapsed;
            if (secondaryCamera.sx > cameraTargetZoom) {
                secondaryCamera.sx = cameraTargetZoom;
            }
        }
        secondaryCamera.sy = secondaryCamera.sx;

        // Angle.
        if (cameraShakingTime === 0) {
            if (secondaryCamera.angle > cameraTargetAngle) {
                secondaryCamera.angle -= cameraRotationSpeed * Math.PI * normalElapsed;
                if (secondaryCamera.angle < cameraTargetAngle) {
                    secondaryCamera.angle = cameraTargetAngle;
                }
            }
            else if (secondaryCamera.angle < cameraTargetAngle) {
                secondaryCamera.angle += cameraRotationSpeed * Math.PI * normalElapsed;
                if (secondaryCamera.angle > cameraTargetAngle) {
                    secondaryCamera.angle = cameraTargetAngle;
                }
            }
        }

        if (cameraShakingTime > 0) {
            secondaryCamera.angle = -0.03 + heartBeats[0].time * 0.2;
            primaryCamera.y -= (heartBeats[0].maxTime * 0.5 - heartBeats[0].time) * 0.5;
        }

        // Apply changes.
        primaryCamera.update();
        secondaryCamera.update();
        hudCamera.update();
    }

    // Check whether an hud entity was clicked.
    function checkHudEntityClick(hudPoint) {
        var i, canSelect = true, selection = -1;
        for (i = 0; i < sceneManager.hudEntities.length; i += 1) {
            var entity = sceneManager.hudEntities[i];
            if (entity.selected) {
                entity.deselectTime = 0.5;
            }
            entity.selected = false;
            var pt = hudPoint;
            if (canSelect && entity.enabled && namespace.pointInRect(pt.x, pt.y, entity.x - entity.width * 0.5 * entity.scaleFactor, entity.y - entity.height * 0.5 * entity.scaleFactor, entity.x + entity.width * 0.5 * entity.scaleFactor, entity.y + entity.height * 0.5 * entity.scaleFactor)) {
                entity.selected = true;
                entity.deselectTime = 0;
                selection = i;
                canSelect = false;
            }
        }
        return ((selection !== -1) ? sceneManager.hudEntities[selection] : null);
    }

    function checkPageItemClick(hudPoint, deselect, action) {
        var pt = hudPoint;
        var itemSelected = null;
        for (var i = 0; i < sceneManager.pageScroller.items.length; i += 1) {
            var item = sceneManager.pageScroller.items[i];
            if (!deselect && !itemSelected && namespace.pointInRect(pt.x, pt.y, item.x + item.height * 0.05, item.y + item.height * 0.05 - sceneManager.pageScroller.offset, item.x + item.height * 0.05 + item.width - item.height * 0.1, item.y + item.height * 0.05 + item.height - item.height * 0.05 - sceneManager.pageScroller.offset)) {
                itemSelected = item;
                if (!sceneManager.showNetworkPanel) {
                    if (item.x + item.height > pt.x) {
                        if (action && sceneManager.canClick) {
                            item.star = (!item.star ? true : false);
                            if (item.star) {
                                if (-1 === sceneManager.isInFavList(item.id)) {
                                    sceneManager.favMasternodes.push(item.id);
                                    sceneManager.saveFavList();

                                    sceneManager.effects.push(new namespace.FloatingEffect(item.x + item.height * 0.35, item.y + item.height * 0.47 - sceneManager.pageScroller.offset, item.height * 0.6));
                                }
                            }
                            else {
                                var id = sceneManager.isInFavList(item.id);
                                if (id !== -1) {
                                    sceneManager.favMasternodes.splice(id, 1);
                                    sceneManager.saveFavList();

                                    if (sceneManager.pageType === namespace.PageTypeEnum.MyMasternodes) {
                                        sceneManager.updatedData = true;
                                        sceneManager.updatePage(sceneManager.pageType, 0, false);
                                    }
                                }
                            }
                        }
                        item.isStarDown = true;
                    }
                    else if (item.x + item.width - item.height < pt.x && item.url !== "") {
                        itemSelected = item;
                        item.isDown = true;

                        if (action && sceneManager.canClick) {
                            namespace.openUrl(item.url);
                        }
                    }
                }
            }
            else {
                item.isDown = false;
                item.isStarDown = false;
            }
        }
        return itemSelected;
    }

    // Handle pointer down event.
    function pointerDown(event) {
        var x, y, size, point, hudPoint;

        isPointerDown = true;

        // Retrieve the pointer coordinates.
        x = event.pageX;
        y = event.pageY;

        // Project the points to appropriate cameras.
        point = namespace.screenToScene({ "x": x / optimalRatioX, "y": y / optimalRatioY });
        hudPoint = namespace.screenToHud({ "x": x / optimalRatioX, "y": y / optimalRatioY });
        size = namespace.screenToHud({ "x": canvas.width, "y": canvas.height });

        pointerStartPos = { "x": hudPoint.x, "y": hudPoint.y };

        if (sceneManager && currentAppState === namespace.AppStateEnum.Run) {
            sceneManager.selectedHudEntity = checkHudEntityClick(hudPoint);
            if (!sceneManager.showNetworkPanel) {
                if (!sceneManager.selectedHudEntity && sceneManager.pageType !== namespace.PageTypeEnum.None) {
                    sceneManager.pageScroller.downDistance = 0;
                    sceneManager.pageScroller.isDown = true;
                    sceneManager.pageScroller.downTime = 0;
                    sceneManager.pageScroller.point = { "x": hudPoint.x, "y": hudPoint.y };
                    sceneManager.pageScroller.scrollTime = 1.5;
                    checkPageItemClick(hudPoint);
                    sceneManager.canClick = true;
                }
            }
        }
    }

    // Handle pointer move event.
    function pointerMove(event) {
        var x, y, size, point, hudPoint;

        // Retrieve the pointer coordinates.
        x = event.pageX;
        y = event.pageY;

        // Project the points to appropriate cameras.
        point = namespace.screenToScene({ "x": x / optimalRatioX, "y": y / optimalRatioY });
        hudPoint = namespace.screenToHud({ "x": x / optimalRatioX, "y": y / optimalRatioY });
        size = namespace.screenToHud({ "x": canvas.width, "y": canvas.height });

        if (isPointerDown) {
            // Track pointer down event.
            if (sceneManager && currentAppState === namespace.AppStateEnum.Run) {
                // Update the selected hud entity.
                sceneManager.selectedHudEntity = checkHudEntityClick(hudPoint);
                if (!sceneManager.showNetworkPanel) {
                    // A page is opened.
                    if (sceneManager.pageType !== namespace.PageTypeEnum.None) {
                        if (sceneManager.pageScroller.maxOffset > 0) {
                            if (sceneManager.pageScroller.isDown && sceneManager.pageScroller.hasBar) {
                                var multiplier = 1;
                                if (sceneManager.pageScroller.offset < sceneManager.pageScroller.minOffset) {
                                    multiplier = 0.35;
                                }
                                else if (sceneManager.pageScroller.offset > sceneManager.pageScroller.maxOffset) {
                                    multiplier = 0.35;
                                }

                                if (Math.abs(sceneManager.pageScroller.point.y - hudPoint.y) > sceneManager.pageScroller.rowHeight * 0.2) {
                                    sceneManager.pageScroller.offset += (sceneManager.pageScroller.point.y - hudPoint.y) * 0.6 * multiplier;
                                    sceneManager.pageScroller.downDistance += (sceneManager.pageScroller.point.y - hudPoint.y);
                                    sceneManager.pageScroller.point = { "x": hudPoint.x, "y": hudPoint.y };
                                    sceneManager.canClick = false;
                                }
                            }
                        }
                        checkPageItemClick(hudPoint);
                        sceneManager.pageScroller.scrollTime = 1.5;
                    }
                }
            }
        }
    }

    // Handle pointer up event.
    function pointerUp(event) {
        var x, y, size, point, hudPoint;

        // Retrieve the pointer coordinates.
        x = event.pageX;
        y = event.pageY;

        // Project the points to appropriate cameras.
        point = namespace.screenToScene({ "x": x / optimalRatioX, "y": y / optimalRatioY });
        hudPoint = namespace.screenToHud({ "x": x / optimalRatioX, "y": y / optimalRatioY });
        size = namespace.screenToHud({ "x": canvas.width, "y": canvas.height });

        if (isPointerDown) {
            isPointerDown = false;
            if (sceneManager && currentAppState === namespace.AppStateEnum.Run) {
                var wasShowingPanel = sceneManager.showNetworkPanel;
                sceneManager.showNetworkPanel = false;
                sceneManager.selectedGridCell = null;

                // A hud item has been clicked.
                sceneManager.selectedHudEntity = checkHudEntityClick(hudPoint);
                if (sceneManager.selectedHudEntity) {
                    var type = sceneManager.selectedHudEntity.type;

                    sceneManager.selectedHudEntity.deselectTime = 0.5;
                    sceneManager.selectedHudEntity.selected = false;
                    sceneManager.selectedHudEntity = null;

                    switch (type) {
                        case namespace.HudEntityTypeEnum.StarButton:
                            sceneManager.showMenuPanel = false;
                            sceneManager.showNetworkPanel = false;
                            sceneManager.updatePage((sceneManager.pageType === namespace.PageTypeEnum.AllMasternodes) ? namespace.PageTypeEnum.MyMasternodes : namespace.PageTypeEnum.AllMasternodes, 0, true);
                            break;
                        case namespace.HudEntityTypeEnum.MenuButton:
                            sceneManager.showNetworkPanel = false;
                            sceneManager.showMenuPanel = !sceneManager.showMenuPanel ? true : false;
                            break;
                        case namespace.HudEntityTypeEnum.Title:
                            sceneManager.showMenuPanel = false;
                            sceneManager.showNetworkPanel = !wasShowingPanel ? true : false;
                            break;
                        case namespace.HudEntityTypeEnum.SearchButton:
                            sceneManager.showNetworkPanel = false;
                            sceneManager.showMenuPanel = false;
                            $("#searchbox").focus();
                            break;
                        case namespace.HudEntityTypeEnum.ListButton:
                            sceneManager.showMenuPanel = false;
                            sceneManager.showNetworkPanel = !sceneManager.showNetworkPanel ? true : false;
                            break;
                        case namespace.HudEntityTypeEnum.FavButton:
                            sceneManager.showMenuPanel = false;
                            sceneManager.showNetworkPanel = false;
                            sceneManager.updatePage((sceneManager.pageType === namespace.PageTypeEnum.AllMasternodes) ? namespace.PageTypeEnum.MyMasternodes : namespace.PageTypeEnum.AllMasternodes, 0, true);
                            break;
                    }
                }
                    // A page is opened.
                else if (!wasShowingPanel && sceneManager.pageType !== namespace.PageTypeEnum.None) {
                    var item = checkPageItemClick(hudPoint, false, true);
                    if (item) {
                        // TODO: process item click.
                        sceneManager.showNetworkPanel = false;
                        sceneManager.showMenuPanel = false;
                    }

                    if (sceneManager.pageScroller.isDown && sceneManager.pageScroller.hasBar) {
                        if (Math.abs(sceneManager.pageScroller.point.y - hudPoint.y) > sceneManager.pageScroller.rowHeight * 0.2) {
                            sceneManager.pageScroller.offset += (sceneManager.pageScroller.point.y - hudPoint.y) * 0.6;
                            sceneManager.pageScroller.downDistance += (sceneManager.pageScroller.point.y - hudPoint.y);
                            sceneManager.pageScroller.point = { "x": hudPoint.x, "y": hudPoint.y };
                        }
                    }
                    sceneManager.pageScroller.isDown = false;
                    sceneManager.pageScroller.scrollTime = 1.5;
                    checkPageItemClick(hudPoint, true);
                }

            }
        }
    }

    namespace.onBackButtonPressed = function () {
        if (sceneManager.showNetworkPanel || sceneManager.showMenuPanel) {
            sceneManager.showNetworkPanel = false;
            sceneManager.showMenuPanel = false;
            return "stay";
        }

        // Exit the app.
        return "exit";
    };

    namespace.setSearch = function (value) {
        var old = sceneManager.searchMode;
        sceneManager.searchMode = value;
        if (value && value !== old) {
            sceneManager.searchModeTime = 0.5;
        }
        sceneManager.updateTime = 0;
        sceneManager.resizeTime = 1.5;
        sceneManager.showNetworkPanel = false;
        sceneManager.showMenuPanel = false;
    };

    namespace.setFilter = function (value) {
        sceneManager.searchString = value;
        sceneManager.resizeTime = 1;
        sceneManager.showNetworkPanel = false;
        sceneManager.showMenuPanel = false;

        sceneManager.updatedData = true;
        sceneManager.updatePage(sceneManager.pageType, 0, false);
    };

    // Load the scene.
    function loadScene() {
        var camera, size, target = getCameraTarget();

        namespace.resize();

        resetCameraDefaults();

        sceneManager.load();

        // Camera settings.
        cameraTargetAngle = 0;
        cameraTarget = { "x": target.x, "y": target.y };
        cameraTargetZoom = target.zoom;

        camera = new namespace.Camera();
        camera.multiply(unitCamera);
        size = camera.screenToCamera(canvas.width, canvas.height);
        primaryCamera.x = size.x / 2 - cameraTarget.x;
        primaryCamera.y = size.y / 2 - cameraTarget.y;

        secondaryCamera.angle = 0;
        secondaryCamera.sx = cameraTargetZoom;
        secondaryCamera.sy = cameraTargetZoom;
    };

})(window.MNApp = window.MNApp || {});
