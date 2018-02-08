// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

(function (namespace, undefined) {
    "use strict";

    // A 2D camera class for translation, scaling and rotation transformations.
    // Matrix algebra from https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js.
    namespace.Camera = function () {
        if (!(this instanceof namespace.Camera)) {
            throw new Error("Constructor called as a function.");
        }

        this.reset();
    };

    // Reset both camera properties and matrix to identity.
    namespace.Camera.prototype.reset = function () {
        this.x = 0;     // Translation on x.
        this.y = 0;     // Translation on y.
        this.sx = 1;    // Scaling on x.
        this.sy = 1;    // Scaling on y.
        this.tx = 0;    // Target position x.
        this.ty = 0;    // Target position y.
        this.angle = 0; // Angle.
        this.matrix = [1, 0, 0, 1, 0, 0];
    };

    // Update the internal matrix with translation, scaling and rotation properties.
    namespace.Camera.prototype.update = function () {
        this.matrix = [1, 0, 0, 1, 0, 0];
        this.translate(this.x, this.y);
        this.scale(this.sx, this.sy);
        this.rotate(this.angle);
    };

    // Translation. Does not update camera x and y properties.
    namespace.Camera.prototype.translate = function (x, y) {
        this.matrix[4] += this.matrix[0] * x + this.matrix[2] * y;
        this.matrix[5] += this.matrix[1] * x + this.matrix[3] * y;
    };

    // Scaling. Does not update camera sx and sy properties.
    namespace.Camera.prototype.scale = function (x, y) {
        this.matrix[0] *= x;
        this.matrix[1] *= x;
        this.matrix[2] *= y;
        this.matrix[3] *= y;
    };

    // Rotation. Does not update the camera angle.
    namespace.Camera.prototype.rotate = function (angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var m11 = this.matrix[0] * c + this.matrix[2] * s;
        var m12 = this.matrix[1] * c + this.matrix[3] * s;
        var m21 = this.matrix[0] * -s + this.matrix[2] * c;
        var m22 = this.matrix[1] * -s + this.matrix[3] * c;
        this.matrix[0] = m11;
        this.matrix[1] = m12;
        this.matrix[2] = m21;
        this.matrix[3] = m22;
    };

    // Apply inverse transform to the point (x, y).
    namespace.Camera.prototype.screenToCamera = function (x, y) {
        var px = x;
        var py = y;
        var d = 1 / (this.matrix[0] * this.matrix[3] - this.matrix[1] * this.matrix[2]);
        x = px * (this.matrix[3] * d) + py * (-this.matrix[2] * d) +
            (d * (this.matrix[2] * this.matrix[5] - this.matrix[3] * this.matrix[4]));
        y = px * (-this.matrix[1] * d) + py * (this.matrix[0] * d) +
            (d * (this.matrix[1] * this.matrix[4] - this.matrix[0] * this.matrix[5]));
        return { "x": x, "y": y };
    };

    // Apply transform to the point (x, y).
    namespace.Camera.prototype.cameraToScreen = function (x, y) {
        var px = x;
        var py = y;
        x = px * this.matrix[0] + py * this.matrix[2] + this.matrix[4];
        y = px * this.matrix[1] + py * this.matrix[3] + this.matrix[5];
        return { "x": x, "y": y };
    };

    // Multiply this matrix with the camera matrix.
    namespace.Camera.prototype.multiply = function (camera) {
        var m11 = this.matrix[0] * camera.matrix[0] + this.matrix[2] * camera.matrix[1];
        var m12 = this.matrix[1] * camera.matrix[0] + this.matrix[3] * camera.matrix[1];
        var m21 = this.matrix[0] * camera.matrix[2] + this.matrix[2] * camera.matrix[3];
        var m22 = this.matrix[1] * camera.matrix[2] + this.matrix[3] * camera.matrix[3];
        var dx = this.matrix[0] * camera.matrix[4] + this.matrix[2] * camera.matrix[5] + this.matrix[4];
        var dy = this.matrix[1] * camera.matrix[4] + this.matrix[3] * camera.matrix[5] + this.matrix[5];
        this.matrix[0] = m11;
        this.matrix[1] = m12;
        this.matrix[2] = m21;
        this.matrix[3] = m22;
        this.matrix[4] = dx;
        this.matrix[5] = dy;
    };

})(window.MNApp = window.MNApp || {});
