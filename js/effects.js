// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // Base Effect.
    namespace.Effect = function (x, y, radius) {
        if (!(this instanceof namespace.Effect)) {
            throw new Error("Constructor called as a function.");
        }

        this.x = x;                                     // Position x.
        this.y = y;                                     // Position y.
        this.radius = radius;                           // Bounding circle radius.
        this.vx = 0;                                    // Velocity x.
        this.vy = 0;                                    // Velocity y.
        this.speed = 0;                                 // Speed.
        this.friction = 1;                              // Friction.
        this.mass = 1;                                  // Mass.
        this.direction = namespace.DirectionEnum.None;  // Direction.
        this.rotationSpeed = 0;                         // Rotation speed.
        this.angle = 0;                                 // Current angle.
        this.gravity = 9.78;                            // Gravity factor.
        this.value = 0;                                 // Value of the effect.
        this.type = namespace.EffectTypeEnum.None;      // Effect type.
        this.activationCooldown = 0;                    // Determine when the effect becomes active.
        this.selfDestroyTime = -1;                      // Self destroy after this time (-1 for infinite time).
        this.startFadeTime = 1;                         // Start fade time.
        this.restoreBaseAngle = false;                  // Restore the base angle after rotation.
        this.cooldown = 0;                              // cooldown time before the object can move.
        this.lifeSpan = 0;                              // miscellaneous timer.
        this.scaleFactor = 1;                           // Scale factor.
        this.scaleTime = 0;                             // Scale time.
        this.scaleSpeed = 2;                            // Scale speed.
        this.useTransform = false;                      // Whether the effect should be rendered using the level transform.
        this.hud = false;                               // Whether the effect should be rendered in the hud.
        this.background = false;                        // Whether the effect should be rendered in the background.
        this.acc = 0;                                   // Accumulator for various purposes.
    };

    // Update the effect time-based properties.
    namespace.Effect.prototype.update = function (elapsed) {
        // Update the activation cooldown.
        if (this.activationCooldown > 0) {
            this.activationCooldown -= elapsed;
            if (this.activationCooldown < 0) {
                this.activationCooldown = 0;
            }
        }

        // Update the scale time.
        if (this.scaleTime > 0) {
            this.scaleTime -= elapsed * this.scaleSpeed;
            if (this.scaleTime < 0) {
                this.scaleTime = 0;
            }
        }
        else if (this.scaleTime < 0) {
            this.scaleTime += elapsed * this.scaleSpeed;
            if (this.scaleTime > 0) {
                this.scaleTime = 0;
            }
        }

        if (this.cooldown > 0) {
            this.cooldown -= elapsed;
            if (this.cooldown < 0) {
                this.cooldown = 0;
            }
        }

        if (this.lifeSpan > 0) {
            this.lifeSpan -= elapsed;
            if (this.lifeSpan < 0) {
                this.lifeSpan = 0;
            }
        }

        // Update the self destroy time.
        if (this.selfDestroyTime > 0) {
            this.selfDestroyTime -= elapsed;
            if (this.selfDestroyTime < 0) {
                this.selfDestroyTime = 0;
            }
        }

        // Apply friction on velocity X.
        if (this.vx > 0) {
            this.vx -= this.friction * elapsed;
            if (this.vx < 0) {
                this.vx = 0;
            }
        }
        else if (this.vx < 0) {
            this.vx += this.friction * elapsed;
            if (this.vx > 0) {
                this.vx = 0;
            }
        }

        // Apply friction on rotation speed.
        if (!this.restoreBaseAngle || (this.restoreBaseAngle && Math.abs(this.rotationSpeed) > 1)) {
            if (this.rotationSpeed > 0) {
                this.rotationSpeed -= this.friction * elapsed;
                if (this.rotationSpeed < 0) {
                    this.rotationSpeed = 0;
                }
            }
            else if (this.rotationSpeed < 0) {
                this.rotationSpeed += this.friction * elapsed;
                if (this.rotationSpeed > 0) {
                    this.rotationSpeed = 0;
                }
            }
        }
        else if (this.restoreBaseAngle) {
            this.rotationSpeed = 0;
        }

        // Restore the entity angle.
        if (this.restoreBaseAngle && this.rotationSpeed === 0 && this.angle !== 0) {
            var shortest = namespace.shortestArc(this.angle, 0);
            if (shortest > 0.1) {
                if (this.angle > 0) {
                    this.angle += (Math.PI * 2) * elapsed;
                }
                else {
                    this.angle -= (Math.PI * 2) * elapsed;
                }
            }
            else {
                this.angle = 0;
            }
        }

        // Apply rotation to angle.
        this.angle = this.rotationSpeed ? (this.angle + this.rotationSpeed * (Math.PI * 2) * elapsed) % (Math.PI * 2) : this.angle;

        // Apply gravity.
        this.vy += this.gravity * elapsed * this.mass;

        // Apply velocity.
        this.y += this.vy * elapsed;
        this.x += this.vx * elapsed;
    };

    // Floating Effect.
    namespace.FloatingEffect = function (x, y, radius) {
        if (!(this instanceof namespace.FloatingEffect)) {
            throw new Error("Constructor called as a function.");
        }

        namespace.Effect.call(this, x, y, radius);

        this.gravity = 0;
        this.friction = 1;
        this.mass = 3;
        this.selfDestroyTime = 0.8;
        this.startFadeTime = 0.5;
        this.type = namespace.EffectTypeEnum.Floating;
        this.value = 0;
        this.angle = 0;
        this.rotationSpeed = (Math.random() > 0.5) ? -0.5 * Math.PI : 0.5 * Math.PI;
        this.vx = radius * 3;
        this.vy = -radius;
        this.scaleFactor = 0.5;
        this.scaleTime = 0.5;
        this.scaleSpeed = 3;
    };

    // Setup the Floating Effect prototype chain.
    namespace.FloatingEffect.prototype = Object.create(namespace.Effect.prototype);

})(window.MNApp = window.MNApp || {});
