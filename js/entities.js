// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Base Entity.
    namespace.Entity = function () {
        if (!(this instanceof namespace.Entity)) {
            throw new Error("Constructor called as a function.");
        }

        this.vx = 0;                                            // Velocity x.
        this.vy = 0;                                            // Velocity y.
        this.scaleSpeed = 1;                                    // Scale Speed.
        this.rotationSpeed = Math.PI * 0.3;                     // Rotation Speed.
        this.scaleFactor = 1;                                   // Scale factor.
        this.targetScaleFactor = 1;                             // Target Scale factor.
        this.angle = 0;                                         // Current angle.
        this.targetAngle = 0;                                   // Target angle.
        this.gravity = 9.78;                                    // Gravity factor.
        this.mass = 1;

        this.heartBeats = [];
        this.effects = [];
    };

    // Update the Entity time-based properties.
    namespace.Entity.prototype.update = function (elapsed) {
        var i, len, heartbeat;
        for (i = 0, len = this.heartBeats.length; i < len; i+=1) {
            heartbeat = this.heartBeats[i];
            if (heartbeat.direction === 0 && heartbeat.time <= heartbeat.maxTime) {
                heartbeat.time = Math.min(heartbeat.time + elapsed * heartbeat.speed1, heartbeat.maxTime);
                if (heartbeat.time === heartbeat.maxTime) {
                    heartbeat.direction = 1;
                }
            }
            else if (heartbeat.direction === 1 && heartbeat.time >= 0) {
                heartbeat.time = Math.max(heartbeat.time - elapsed * heartbeat.speed2, 0);
                if (heartbeat.time === 0) {
                    heartbeat.direction = 0;
                    if (heartbeat.event) {
                        heartbeat.event();
                    }
                }
            }
        }

        if (this.scaleFactor > this.targetScaleFactor) {
            this.scaleFactor -= this.scaleSpeed * elapsed;
            if (this.scaleFactor < this.targetScaleFactor) {
                this.scaleFactor = this.targetScaleFactor;
            }
        }
        else if (this.scaleFactor < this.targetScaleFactor) {
            this.scaleFactor += this.scaleSpeed * elapsed;
            if (this.scaleFactor > this.targetScaleFactor) {
                this.scaleFactor = this.targetScaleFactor;
            }
        }

        if (this.angle > this.targetAngle) {
            this.angle -= this.rotationSpeed * elapsed;
            if (this.angle < this.targetAngle) {
                this.angle = this.targetAngle;
            }
        }
        else if (this.angle < this.targetAngle) {
            this.angle += this.rotationSpeed * elapsed;
            if (this.angle > this.targetAngle) {
                this.angle = this.targetAngle;
            }
        }
    };

    // Hud Entity.
    namespace.HudEntity = function (type) {
        if (!(this instanceof namespace.HudEntity)) {
            throw new Error("Constructor called as a function.");
        }

        namespace.Entity.call(this);

        this.type = type;
        this.x = 0;
        this.y = 0;
        this.tx = 0;
        this.ty = 0;
        this.width = 0;
        this.height = 0;
        this.speed = 2;
        this.direction = namespace.DirectionEnum.Right;
        this.selected = false;
        this.deselectTime = 0;
        this.spawned = true;
        this.scaleSpeed = 15;
        this.perpetualAngle = 0;
        this.enabled = true;
        this.heartBeats = [
            { "time": Math.random() * 1.5, "direction": 0, "maxTime": 1.5, "speed1": 1, "speed2": 2 },
            { "time": 0, "direction": 0, "maxTime": 0.1, "speed1": 1, "speed2": 1 },
            { "time": Math.random(), "direction": 0, "maxTime": 1, "speed1": 1, "speed2": 2 }
        ];
    };

    // Setup the Hud Entity prototype chain.
    namespace.HudEntity.prototype = Object.create(namespace.Entity.prototype);

    // Update the Hud Entity time-based properties.
    namespace.HudEntity.prototype.update = function (elapsed) {

        var dockIt = true;
        var distance = namespace.distance(this.x, this.y, this.tx, this.ty);
        if (distance > this.width * 0.001) {
            this.vx = (this.tx - this.x) / distance * this.speed * distance * 2;
            this.vy = (this.ty - this.y) / distance * this.speed * distance * 2;
            this.x += this.vx * elapsed;
            this.y += this.vy * elapsed;
            if (namespace.distance(this.x, this.y, this.tx, this.ty) < distance) {
                dockIt = false;
            }
        }

        if (dockIt) {
            this.vx = 0;
            this.vy = 0;
            this.x = this.tx;
            this.y = this.ty;
        }

        if (this.deselectTime > 0) {
            this.deselectTime -= elapsed;
            if (this.deselectTime < 0) {
                this.deselectTime = 0;
            }
        }

        this.perpetualAngle = (this.perpetualAngle + Math.PI * 0.9 * elapsed) % (Math.PI * 2);

        namespace.Entity.prototype.update.call(this, elapsed);
    };

})(window.MNApp = window.MNApp || {});
