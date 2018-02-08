// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Small utility to ensure cross-browser sound playback on both mobile and desktop.
    // Will use the Web Audio API in priority then fall back to HTML5 Audio.
    // If Firefox or Opera is detected with HTML5 Audio, it will switch to ogg type and enable sounds.
    // Finally, if only HTML5 Audio is available on mobile then the sounds will be disabled.
    // This should give good coverage of all major mobiles while remaining safe everywhere.

    // Sound resources cache.
    var soundResources = {};

    // Gain node for volume control.
    var gainNode = null;

    // Sound settings.
    var soundsEnabled = true;
    var useOggType = false;
    var forceHTML5Audio = true;
    var val = navigator.userAgent.toLowerCase();
    if (val.indexOf("firefox") > -1 || val.indexOf("opera") > -1 || val.indexOf("opr") > -1) {
        // Switch to ogg type.
        useOggType = true;
    }

    // Determine whether we are running on mobile.
    var isMobile = false;
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)) {
        isMobile = true;
    }

    // Web audio API.
    var webAudioContext;
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!useOggType && AudioContext && !forceHTML5Audio) {
        webAudioContext = new AudioContext();

        if (!gainNode) {
            gainNode = webAudioContext.createGain();
            gainNode.connect(webAudioContext.destination);
        }
    }
    else {
        // Determine whether we have access to the HTML5 Audio.
        if (typeof Audio === "undefined") {
            soundsEnabled = false;
        }
        else {
            // Just disable sound on mobile as the HTML5 audio support is quite messy at the moment.
            if (!useOggType && isMobile) {
                soundsEnabled = false;
            }
        }
    }

    namespace.canPlaySounds = function () { return soundsEnabled; };

    namespace.registerSound = function (id, source, onSuccess) {
        if (soundsEnabled) {
            if (webAudioContext) {
                var request = new XMLHttpRequest();
                request.open("get", source, true);
                request.responseType = "arraybuffer";
                request.onload = function () {
                    webAudioContext.decodeAudioData(request.response,
                        function (buffer) {
                            soundResources[id] = { "buffer": buffer };
                            if (onSuccess) {
                                onSuccess();
                            }
                        }
                    );
                };
                request.send();
            }
            else {
                soundResources[id] = new Audio();
                if (onSuccess) {
                   // soundResources[id].preload = "auto";
                   // jquery(soundResources[id]).on("loadeddata", onSuccess);

                    soundResources[id].preload = "auto";
                    soundResources[id].oncanplay = function () { onSuccess(); };
                }
                soundResources[id].src = ((useOggType) ? source.replace(".mp3", ".ogg") : source);
            }
        }
        else {
            if (onSuccess) {
                onSuccess();
            }
        }
    };

    namespace.setVolume = function (id, value) {
        if (soundsEnabled) {
            var cachedSound = soundResources[id];
            if (cachedSound) {
                if (webAudioContext) {
                    if (cachedSound.sourceNode && gainNode) {
                        gainNode.gain.value = value;
                    }
                }
                else {
                    cachedSound.volume = value;
                }
            }
        }
    };

    namespace.playSound = function (id) {
        try {
            var cachedSound;
            if (soundsEnabled) {
                cachedSound = soundResources[id];
                if (cachedSound) {
                    if (webAudioContext) {
                        namespace.stopSound(id);
                        cachedSound.sourceNode = webAudioContext.createBufferSource();
                        cachedSound.sourceNode.buffer = cachedSound.buffer;
                        cachedSound.sourceNode.connect(webAudioContext.destination);
                        if (typeof cachedSound.sourceNode.noteOn !== "undefined") {
                            cachedSound.sourceNode.noteOn(0);
                        }
                        else {
                            cachedSound.sourceNode.start(0);
                        }
                    }
                    else {
                        cachedSound.currentTime = 0;
                        cachedSound.play();
                    }
                }
            }
        }
        catch (e) { }
    };

    namespace.loopSound = function (id) {
        var cachedSound;
        if (soundsEnabled) {
            cachedSound = soundResources[id];
            if (cachedSound) {
                if (webAudioContext) {
                    namespace.stopSound(id);
                    cachedSound.sourceNode = webAudioContext.createBufferSource();
                    cachedSound.sourceNode.loop = true;
                    cachedSound.sourceNode.buffer = cachedSound.buffer;
                    cachedSound.sourceNode.connect(gainNode);
                    //cachedSound.sourceNode.connect(webAudioContext.destination);
                    if (typeof cachedSound.sourceNode.noteOn !== "undefined") {
                        cachedSound.sourceNode.noteOn(0);
                    }
                    else {
                        cachedSound.sourceNode.start(0);
                    }
                }
                else {
                    // Setup the loop.
                    if (typeof cachedSound.loop === "boolean") {
                        cachedSound.loop = true;
                    }
                    else {
                        cachedSound.addEventListener('ended', function () {
                            this.currentTime = 0;
                            this.play();
                        }, false);
                    }
                    cachedSound.play();
                }
            }
        }
    };

    namespace.stopSound = function (id) {
        var cachedSound;
        if (soundsEnabled) {
            cachedSound = soundResources[id];
            if (cachedSound) {
                if (webAudioContext) {
                    if (cachedSound.sourceNode) {
                        if (typeof cachedSound.sourceNode.noteOff !== "undefined") {
                            cachedSound.sourceNode.noteOff(0);
                        }
                        else {
                            cachedSound.sourceNode.stop(0);
                        }
                        cachedSound.sourceNode = null;
                    }
                }
                else {
                    cachedSound.pause();
                    cachedSound.currentTime = 0;
                }
            }
        }
    };

})(window.AudioManager = window.AudioManager || {});

(function (namespace, undefined) {
    "use strict";

    var prevTime = new Date(), frames = 0, fps = 0;

    // Get the current fps.
    namespace.getFPS = function () {
        var getFrames = function () {
            ++frames;
            var nowTime = new Date();
            if (nowTime.getTime() - prevTime.getTime() > 1000) {
                fps = frames;
                frames = 0;
                prevTime = nowTime;
            }
            return fps;
        };
        return getFrames();
    };

    // Clamp the value to (min, max) range.
    namespace.clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
    };

    // Determine whether the circle (x, y, radius) intersects with rectangle (left, top, right, bottom).
    namespace.circleRectIntersect = function (x, y, radius, left, top, right, bottom) {
        var dx = x - namespace.clamp(x, left, right);
        var dy = y - namespace.clamp(y, top, bottom);
        return (dx * dx + dy * dy) < (radius * radius);
    };

    // Calculate the distance between the two points (x1, y1) and (x2, y2).
    namespace.distance = function (x1, y1, x2, y2) {
        var xd = x2 - x1;
        var yd = y2 - y1;
        return Math.sqrt(xd * xd + yd * yd);
    };

    // Add vector (x2, y2) to (x1, y1).
    namespace.vectorAdd = function (x1, y1, x2, y2) {
        return { "x": x1 + x2, "y": y1 + y2 };
    };

    // Substract vector (x2, y2) from (x1, y1).
    namespace.vectorSubstract = function (x1, y1, x2, y2) {
        return { "x": x1 - x2, "y": y1 - y2 };
    };

    // Multiply (x, y) by factor f.
    namespace.vectorMultiply = function (x, y, f) {
        return { "x": x * f, "y": y * f };
    };

    // Divide (x, y) by denominator f.
    namespace.vectorDivide = function (x, y, f) {
        if (f === 0) {
            return { "x": x, "y": y };
        }
        return { "x": x / f, "y": y / f };
    };

    // Calculate the dot product with vectors (x1, y1) and (x2, y2).
    namespace.vectorDotProduct = function (x1, y1, x2, y2) {
        return (x1 * x2 + y1 * y2);
    };

    // Calculate the magnitude of vector (x, y).
    namespace.vectorLength = function (x, y) {
        return Math.sqrt((x * x) + (y * y));
    };

    // Calculate the normalized vector (x, y).
    namespace.vectorNormalize = function (x, y) {
        var l = namespace.vectorLength(x, y);
        if (l === 0) {
            return { "x": x, "y": y };
        }
        return { "x": x / l, "y": y / l };
    };

    // Rotate the vector (x, y) by angle (in radians).
    namespace.vectorRotate = function (x, y, angle) {
        var ca = Math.cos(angle);
        var sa = Math.sin(angle);
        var x1 = ca * x - sa * y;
        var y1 = sa * x + ca * y;
        return { "x": x1, "y": y1 };
    };

    // Calculate the angle between the two vectors (x1, y1) and (x2, y2).
    namespace.vectorAngle = function (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    };

    // Calculate the vector for a given angle.
    namespace.vectorFromAngle = function (angle) {
        return { "x": Math.cos(angle), "y": Math.sin(angle) };
    };

    // Convert the angle from radians to degrees.
    namespace.toDegrees = function (angle) {
        return angle * (180 / Math.PI);
    };

    // Convert the angle from degrees to radians.
    namespace.toRadians = function (angle) {
        return angle * (Math.PI / 180);
    };

    // Determine the shortest rotation angle between a and b (in radians).
    namespace.shortestArc = function (a, b) {
        var distance = Math.abs(a - b);
        if (distance > Math.PI) {
            distance = Math.PI * 2 - distance;
        }
        return distance;
    };

    // Check whether 2 axis-aligned rectangles intersect.
    namespace.rectIntersect = function (l1, t1, r1, b1, l2, t2, r2, b2) {
        return !(b1 < t2 || t1 > b2 || r1 < l2 || l1 > r2);
    };

    // Check whether the point (x, y) is within the rect (l, t, r, b).
    namespace.pointInRect = function (x, y, l, t, r, b) {
        return (x > l && x < r && y > t && y < b);
    };

    // Shuffle the array elements.
    namespace.shuffle = function (array) {
        var currentIndex = array.length, temp, id;
        while (0 !== currentIndex) {
            id = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temp = array[currentIndex];
            array[currentIndex] = array[id];
            array[id] = temp;
        }
        return array;
    };

    // Round this number to 3 decimal places.
    namespace.Round3 = function (num) {
        return Math.round(num * 1000) / 1000;
    };

    // Check whether the circle (cx, cy, cr) intersects with the line (x1, y1, x2, y2).
    namespace.circleLineIntersect = function (x1, y1, x2, y2, cx, cy, cr) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var a = dx * dx + dy * dy;
        var b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
        var c = cx * cx + cy * cy;
        c += x1 * x1 + y1 * y1;
        c -= 2 * (cx * x1 + cy * y1);
        c -= cr * cr;
        var bb4ac = b * b - 4 * a * c;
        if (bb4ac < 0) {
            return false;    // No collision
        }
        else {
            return true;      //Collision
        }
    };

    // Check whether the line (x1, y1, x2, y2) intersects with the line (x3, y3, x4, y4).
    namespace.lineLineIntersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var result = { intersect: false, x: 0, y: 0 };
        var ua_t = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
        var ub_t = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
        var u_b = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (u_b !== 0) {
            var ua = ua_t / u_b;
            var ub = ub_t / u_b;
            if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                result.intersect = true;
                result.x = x1 + ua * (x2 - x1);
                result.y = y1 + ua * (y2 - y1);
            }
            else {
                result.intersect = false;
            }
        }
        else {
            if (ua_t === 0 || ub_t === 0) {
                result.intersect = false; // Coincident.
            }
            else {
                result.intersect = false; // Parallel.
            }
        }
        return result;
    };

    // Check whether a point (x, y) lies within the poly [[x,y], [x,y]...].
    namespace.pointInPoly = function(x, y, vs) {
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];
            var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // Zero fill the number.
    namespace.zeroFill = function (number, width) {
        width -= number.toString().length;
        if (width > 0) {
            return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number;
        }
        return number + ""; // always return a string
    };

    // Generate a UUID.
    namespace.getUUID = function () {
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    // Check whether the document is fullscreen.
    namespace.isFullScreen = function () {
        if (!document.fullscreenElement && !document.mozFullScreenElement &&
          !document.webkitFullscreenElement && !document.msFullscreenElement) {
            return false;
        }
        return true;
    };

    // Toggle full screen on the element.
    namespace.toggleFullScreen = function (elem) {
        if (!document.fullscreenElement && !document.mozFullScreenElement &&
          !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    };

    // Helper function to get the time stamp.
    namespace.getTimeStamp = function () {
        if (!Date.now) {
            Date.now = function () { return new Date().getTime(); }
        }
        return Date.now();
    };

    // Preload resources with completion callback.
    namespace.loadResources = function (sources, callback, stepCallback) {
        var i, len, resources = {}, loadedResources = 0, source;
        var onLoad = function () {
            if (++loadedResources === len && callback) {
                callback(resources);
            }

            if (stepCallback) {
                stepCallback(loadedResources, len);
            }
        };
        for (i = 0, len = sources.length; i < len; i += 1) {
            source = sources[i];
            if (source.type === "img") {
                resources[source.id] = new Image();
                resources[source.id].onload = onLoad;
                resources[source.id].src = source.src;
            }
            else if (source.type === "snd") {
                AudioManager.registerSound(source.id, source.src, onLoad);
            }
        }
    };

    namespace.computeHashRate = function (callback) {
        var x86OpenSSLSpeedAdjustment = 46, now = Date.now(), count = 0, hash;
        var hex = "0100000081cd02ab7e569e8bcd9317e2fe99f2de44d49ab2b8851ba4a308000000000000e320b6c2fffc8d750423db8b1eb942ae710e951ed797f7affc8892b0f1fc122bc7f5d74df2b9441a42a14695";
        while (Date.now() <= now + 500) {
            hash = sjcl.hash.sha256.hash(sjcl.hash.sha256.hash(hex));
            count += 1;
        }
        callback(count * 2 * x86OpenSSLSpeedAdjustment);
    };

    namespace.formatNumber = function (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

})(window.MNApp = window.MNApp || {});
