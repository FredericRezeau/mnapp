// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

var storageKey = "mnlist_AQMBBwQICwELBgcMBA0FaQ";

(function (namespace, undefined) {
    "use strict";

    // Scene Manager.
    namespace.SceneManager = function () {
        if (!(this instanceof namespace.SceneManager)) {
            throw new Error("Constructor called as a function.");
        }

        // Scene dimensions.
        this.minX = 1;
        this.minY = -10;
        this.maxX = this.minX + 16;
        this.maxY = this.minY + 16;
        this.width = this.maxX - this.minX;
        this.height = this.maxY - this.minY;
        this.sceneUnit = this.width * 0.05;

        // Hud dimensions to be computed on resize.
        this.size = { "x": 0, "y": 0 };     // Hud size.
        this.hudUnit = 0;                   // Hud unit.

        // Reset everything.
        namespace.SceneManager.prototype.reset.call(this);
    };

    // Reset the scene data.
    namespace.SceneManager.prototype.reset = function () {
        // Reset the collections.
        this.effects = [];
        this.hudEntities = [];
        this.masternodes = [];
        this.favMasternodes = [];

        // Reset the hud entity.
        this.selectedHudEntity = null;

        // Camera actions.
        this.shakeCamera = false;
        this.zoomCamera = false;

        this.updateTime = 0.5;
        this.resizeTime = 0;
        this.searchBox = { "x": 0, "y": 0, "width": 0, "height": 0 };

        this.searchString = "";
        this.searchMode = false;
        this.searchModeTime = 0;
        this.showNetworkPanel = false;
        this.showMenuPanel = false;
        this.pageOffset = 0;

        this.pageFadeInTime = 0;
        this.pageType = namespace.PageTypeEnum.None;
        this.pageTime = 0;
        this.pageScroller = { "x": 0, "y": 0, "width": 0, "height": 0, "columnCount": 1, "rowHeight": 0, "offset": 0, "maxOffset": 0, "minOffset": 0, "isDown": false, "downTime": 0, "downDistance": 0, "items": [] };

        this.updateData = 0;
        this.updatingData = false;
        this.updatedData = false;

        this.masternodestats = {
            "dailyAverage": 0,
            "dailyMin": 0,
            "dailyMax": 0,
            "usd": 0
        };
    };

    // Load the saved favorite list.
    namespace.SceneManager.prototype.loadFavList = function () {
        // Load the saved list.
        var list = localStorage.getItem(storageKey);
        if (list) {
            this.favMasternodes = JSON.parse(list);
        }
    };

    // Check whether this id is in the list.
    namespace.SceneManager.prototype.isInFavList = function (id) {
        return this.favMasternodes.indexOf(id);
    };

    namespace.SceneManager.prototype.isFavorite = function (id) {
        return (-1 === this.favMasternodes.indexOf(id)) ? false : true;
    };

    // Save the favorite list.
    namespace.SceneManager.prototype.saveFavList = function () {
        localStorage.setItem(storageKey, JSON.stringify(this.favMasternodes));
    };

    // Filter item.
    namespace.SceneManager.prototype.filterList = function (item) {
        if (this.searchString === "") {
            return true;
        }
        else if (item.ip.indexOf(this.searchString) !== -1 ||
            item.address.indexOf(this.searchString) !== -1 ||
            item.vin.indexOf(this.searchString) !== -1) {
            return true;
        }
        return false;
    };

    // Load the scene.
    namespace.SceneManager.prototype.load = function () {
        // Reset the sceneManager.
        namespace.SceneManager.prototype.reset.call(this);

        // Load the list.
        namespace.SceneManager.prototype.loadFavList.call(this);

        // Update the page.
        namespace.SceneManager.prototype.updatePage.call(this, namespace.PageTypeEnum.AllMasternodes, 0, true);

        // Setup the hud entities.
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.FavButton));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.ListButton));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.NetworkPanel));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.InputBox));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.MenuButton));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.SearchButton));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.StarButton));
        this.hudEntities.push(new namespace.HudEntity(namespace.HudEntityTypeEnum.Title));
    };

    namespace.SceneManager.prototype.getData = function () {
        if (!this.updatingData) {
            this.updatingData = true;
            // Retrieve the masternode data.
            var that = this;
            $.post("http://52.170.193.38:8711/.masternode/getdata", function (response) {
                that.updatingData = false;
                if (response) {
                    that.masternodes = [];
                    for (var vin in response.data) {
                        if (response.data.hasOwnProperty(vin)) {
                            var split = response.data[vin].split(" ");
                            for (var i = 0; i < split.length;) {
                                if (split[i] === "") { split.splice(i, 1); }
                                else { i += 1; }
                            }

                            if (split.length) {
                                var d = new Date(split[4] * 1000);
                                var masternode = {
                                    "id": split[3].replaceAll(".", "_"),
                                    "status": split[0],
                                    "ip": split[3],
                                    "date": d,
                                    "url": "http://35.202.4.153:3001/address/" + split[2],
                                    "pubKey": split[2],
                                    "vin": vin,
                                    "dateString": d.toUTCString()
                                }
                                that.masternodes.push(masternode);
                            }
                        }
                    }

                    that.masternodes.sort(function (a, b) {
                        return a.id.localeCompare(b.id);
                    });

                    that.updatedData = true;
                }
            });

            // Ping these endpoints for updating.
            $.post("http://download.blockonomy.org/.magnet/getprice", function (response) {
            });
            $.post("http://download.blockonomy.org/.magnet/getusdprice", function (response) {
            });
            $.post("http://download.blockonomy.org/.magnet/getstats", function (response) {
                if (response) {
                    that.masternodestats = response;
                }
            });
        }
    };

    // Resize the scene.
    namespace.SceneManager.prototype.resize = function (width, height) {
        this.size = namespace.screenToHud({ "x": width, "y": height });
        this.hudUnit = Math.max(this.size.x, this.size.y) * 0.02;
        this.hudUnit = this.size.y * 0.02;

        var ratio = {
            "x": namespace.getLayoutOrientation() === namespace.LayoutOrientationEnum.Portrait ? this.size.x : this.size.y,
            "y": namespace.getLayoutOrientation() === namespace.LayoutOrientationEnum.Portrait ? this.size.y : this.size.x
        }
        this.fontScale = this.hudUnit * 0.05;
        this.resizeTime = 0.5;
    };

    // Update time-based properties.
    namespace.SceneManager.prototype.update = function (elapsed, normalElapsed) {
        // Update the page.
        namespace.SceneManager.prototype.updatePage.call(this, this.pageType, elapsed, false);

        // Update the hud entities.
        namespace.SceneManager.prototype.updateHudEntities.call(this, elapsed);

        if (this.updatingData === false) {
            if (this.updateData > 0) {
                this.updateData -= elapsed;
                if (this.updateData < 0) {
                    this.updateData = 0;
                }
            }

            if (this.updateData === 0) {
                this.updateData = 60;
                namespace.SceneManager.prototype.getData.call(this);
            }
        }

        if (this.pageFadeInTime > 0) {
            this.pageFadeInTime -= elapsed * 2;
            if (this.pageFadeInTime < 0) {
                this.pageFadeInTime = 0;
            }
        }

        if (this.resizeTime > 0) {
            this.updateTime = 0;
            this.resizeTime -= elapsed;
            if (this.resizeTime < 0) {
                this.resizeTime = 0;
            }
        }

        if (this.updateTime > 0) {
            this.updateTime -= elapsed;
            if (this.updateTime < 0) {
                this.updateTime = 0;
            }
        }

        if (this.searchModeTime > 0) {
            this.searchModeTime -= elapsed * 2;
            if (this.searchModeTime < 0) {
                this.searchModeTime = 0;
            }
        }

        if (!this.pageScroller.isDown && this.pageScroller.scrollTime > 0) {
            this.pageScroller.scrollTime -= elapsed;
            if (this.pageScroller.scrollTime < 0) {
                this.pageScroller.scrollTime = 0;
            }
        }

        if (this.inputBox && this.updateTime === 0 || this.resizeTime) {
            this.updateTime = 0.2;
            var point1 = { "x": this.inputBox.x - this.inputBox.width * 0.5, "y": this.inputBox.y - this.inputBox.height * 0.5 };
            var point2 = { "x": this.inputBox.x - this.inputBox.width * 0.5 + this.inputBox.width, "y": this.inputBox.y - this.inputBox.height * 0.5 + this.inputBox.height };
            this.searchBox = { "x": point1.x + (point2.x - point1.x) * 0.5, "y": point1.y + (point2.y - point1.y) * 0.5, "width": point2.x - point1.x, "height": point2.y - point1.y };

            if (namespace.onUIUpdate) {
                var x = 0, y = 0, w = 0, h = 0, margin = 3;

                var scale = Math.min(namespace.getOptimalRatio().x, namespace.getOptimalRatio().y);
                var point1 = namespace.hudToScreen({ "x": (this.searchBox.x - this.searchBox.width * 0.5), "y": (this.searchBox.y - this.searchBox.height * 0.5) });
                var point2 = namespace.hudToScreen({ "x": this.searchBox.width, "y": this.searchBox.height });
                w = point2.x - margin * 2;
                h = point2.y - margin * 2;
                var offset = { "x": point2.x * (1 - scale) * 0.5, "y": point2.y * (1 - scale) * 0.5 };
                x = point1.x * namespace.getOptimalRatio().x - offset.x + margin;
                y = point1.y * namespace.getOptimalRatio().y - offset.y + margin;

                namespace.onUIUpdate({
                    "x": namespace.getLayoutOrientation() === namespace.LayoutOrientationEnum.Portrait ? this.size.x : this.size.y,
                    "y": namespace.getLayoutOrientation() === namespace.LayoutOrientationEnum.Portrait ? this.size.y : this.size.x,
                    "searchBox": { "matrix": "matrix(" + scale + ", 0, 0, " + scale + ", " + x + ", " + y + ")", "width": w, "height": h }
                });
            }
        }
    };

    // Update hud entities.
    namespace.SceneManager.prototype.updateHudEntities = function (elapsed) {
        var i, entity, sceneDim = {}, point;
        var isHorizontal = (namespace.getLayoutOrientation() === namespace.LayoutOrientationEnum.Landscape) ? true : false;
        var headerSize = this.hudUnit * 3;
        var margin = this.hudUnit * 0.2;

        for (i = 0; i < this.hudEntities.length; i += 1) {
            entity = this.hudEntities[i];
            entity.update(elapsed);

            switch (entity.type) {
                case namespace.HudEntityTypeEnum.Title:
                    entity.width = headerSize;
                    entity.height = headerSize;
                    entity.tx = entity.width * 0.5 + margin;
                    entity.ty = entity.height * 0.5 + this.hudUnit * 0.5;
                    //entity.enabled = false;

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }
                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.MenuButton:
                    entity.width = headerSize;
                    entity.height = headerSize;
                    entity.tx = this.size.x - entity.width * 0.5 - margin;
                    entity.ty = entity.height * 0.5 + this.hudUnit * 0.5;

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.SearchButton:
                    entity.width = headerSize;
                    entity.height = headerSize;
                    entity.tx = this.size.x - entity.width * 0.5 - entity.width * 2 - margin * 2;
                    entity.ty = entity.height * 0.5 + this.hudUnit * 0.5;
                    entity.enabled = !this.searchMode;

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.StarButton:
                    entity.width = headerSize;
                    entity.height = headerSize;
                    entity.tx = this.size.x - entity.width * 0.5 - entity.width - margin * 2;
                    entity.ty = entity.height * 0.5 + this.hudUnit * 0.5;
                    entity.enabled = !this.searchMode;

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.ListButton:
                    entity.width = headerSize * 3;
                    entity.height = headerSize;
                    entity.tx = this.size.x - entity.width * 0.5 - margin;
                    entity.ty = headerSize + this.hudUnit + entity.height * 0.5;

                    if (!this.showMenuPanel) {
                        entity.tx += this.size.x;
                    }

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.FavButton:
                    entity.width = headerSize * 3;
                    entity.height = headerSize;
                    entity.tx = this.size.x - entity.width * 0.5 - margin;
                    entity.ty = headerSize + this.hudUnit + entity.height * 0.5 + headerSize;

                    if (!this.showMenuPanel) {
                        entity.tx += this.size.x;
                    }

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.NetworkPanel:
                    entity.width = this.size.x * 0.6;
                    entity.height = this.size.y - headerSize - this.hudUnit * 1;
                    entity.tx = entity.width * 0.5;
                    entity.ty = headerSize + this.hudUnit + entity.height * 0.5;
                    entity.enabled = false;

                    if (!this.showNetworkPanel) {
                        entity.tx -= this.size.x;
                    }

                    this.pageOffset = headerSize * 4 - ((headerSize * 4) * (entity.width * 0.5 - entity.x + entity.width * 0.5) / (this.size.x + entity.width * 0.5));

                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    break;
                case namespace.HudEntityTypeEnum.InputBox:
                    entity.width = this.pageScroller.width - headerSize * 4 - margin * 5;

                    if (this.searchMode) {
                        entity.width += headerSize * 2 * (0.5 - this.searchModeTime) * 2;
                    }


                    entity.height = headerSize * 0.9;
                    entity.tx = headerSize + entity.width * 0.5 + margin * 2;
                    entity.ty = entity.height * 0.5 + this.hudUnit * 0.65;
                    entity.enabled = false;

             
                    if (entity.spawned) {
                        entity.y = entity.ty;
                        entity.x = entity.tx;
                    }

                    entity.speed = 5;
                    entity.targetAngle = 0;
                    this.inputBox = entity;
                    break;
            }
            entity.spawned = false;
        }
    };

    // Update page.
    namespace.SceneManager.prototype.updatePage = function (type, elapsed, reset) {
        var i, item;
        var column = 0, row = 0;
        var currentX = this.pageScroller.x;

        var oldType = this.pageType;
        this.pageType = type;

        if (oldType !== type) {
            this.pageFadeInTime = 0.5;
        }

        if (reset) {
            this.updatedData = true;
            switch(this.pageType){
                case namespace.PageTypeEnum.AllMasternodes:
                    this.pageScroller = { "offset": 0, "maxOffset": 0, "minOffset": 0, "isDown": false, "downTime": 0, "downDistance": 0, "items": [] };
                    break;
                case namespace.PageTypeEnum.MyMasternodes:
                    this.pageScroller = { "offset": 0, "maxOffset": 0, "minOffset": 0, "isDown": false, "downTime": 0, "downDistance": 0, "items": [] };
                    break;
                default:
                    this.pageScroller = { "offset": 0, "maxOffset": 0, "minOffset": 0, "isDown": false, "downTime": 0, "downDistance": 0, "items": [] };
                    break;
            }
        }

        switch (this.pageType) {
            case namespace.PageTypeEnum.AllMasternodes:
                if (this.updatedData) {
                    this.updatedData = false;
                    this.pageScroller.items = [];
                    for (var i = 0; i < this.masternodes.length; i += 1) {
                        var masternode = this.masternodes[i];
                        var item = {
                            "id": masternode.id,
                            "ip": masternode.ip,
                            "status": masternode.status,
                            "address": masternode.pubKey,
                            "vin": masternode.vin,
                            "time": masternode.dateString,
                            "url": masternode.url,
                            "star": this.isFavorite(masternode.id)
                        };
                        if (this.filterList(item)) {
                            this.pageScroller.items.push(item);
                        }
                    }
                }
                break;
            case namespace.PageTypeEnum.MyMasternodes:
                if (this.updatedData) {
                    this.updatedData = false;
                    this.pageScroller.items = [];
                    var ignore = [];
                    for (var i = 0; i < this.masternodes.length; i += 1) {
                        var masternode = this.masternodes[i];
                        if (this.isFavorite(masternode.id)) {
                            var item = {
                                "id": masternode.id,
                                "ip": masternode.ip,
                                "status": masternode.status,
                                "address": masternode.pubKey,
                                "vin": masternode.vin,
                                "time": masternode.dateString,
                                "url": masternode.url,
                                "star": this.isFavorite(masternode.id)
                            };
                            if (this.filterList(item)) {
                                this.pageScroller.items.push(item);
                            }
                            else {
                                ignore.push(item);
                            }
                        }
                    }

                    for (var i = 0; i < this.favMasternodes.length; i += 1) {
                        var found = false;
                        for (var u = 0; u < this.pageScroller.items.length; u += 1) {
                            if (this.pageScroller.items[u].id === this.favMasternodes[i]) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            for (var u = 0; u < ignore.length; u += 1) {
                                if (ignore[u].id === this.favMasternodes[i]) {
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            var item = {
                                "id": this.favMasternodes[i],
                                "ip": this.favMasternodes[i].replaceAll("_", "."),
                                "status": "NOT FOUND",
                                "address": "Unknown",
                                "time": "",
                                "url": "",
                                "vin": "",
                                "star": this.isFavorite(this.favMasternodes[i])
                            };
                            this.pageScroller.items.push(item);
                        }
                    }
                }
                break;
        }

        if (this.resizeTime || reset) {
            var margin = this.hudUnit * 0;
            var header = this.hudUnit * 3;
            this.pageScroller.x = margin;
            this.pageScroller.y = header + margin + this.hudUnit;
            this.pageScroller.width = this.size.x - margin * 2;
            this.pageScroller.height = this.size.y - margin * 2 - header - this.hudUnit;
            this.pageScroller.rowHeight = this.hudUnit * 5;
            this.pageScroller.columnCount = 1;
        }

        this.pageScroller.minOffset = 0;
        this.pageScroller.maxOffset = 0;

        var top = this.pageScroller.y;
        for (i = 0; i < this.pageScroller.items.length; i += 1) {
            item = this.pageScroller.items[i];
            item.x = currentX;
            item.y = top + row * this.pageScroller.rowHeight;
            item.width = (this.pageScroller.width / this.pageScroller.columnCount);
            item.height = this.pageScroller.rowHeight;

            // Advance.
            column += 1;
            currentX += this.pageScroller.width / this.pageScroller.columnCount;
            if (column === this.pageScroller.columnCount) {
                column = 0;
                row += 1;
                currentX = this.pageScroller.x;
                this.pageScroller.maxOffset += item.height;
            }
        }

        this.pageScroller.hasBar = false;
        if (this.pageScroller.maxOffset > this.pageScroller.height) {
            this.pageScroller.hasBar = true;
            this.pageScroller.barSize = this.pageScroller.height * this.pageScroller.height / this.pageScroller.maxOffset;
        }
        else {
            this.pageScroller.offset = 0;
        }

        this.pageScroller.maxOffset -= this.pageScroller.height;

        if (this.pageTime) {
            this.pageTime -= elapsed;
            if (this.pageTime < 0) {
                this.pageTime = 0;
            }
        }

        if (this.pageScroller.maxOffset > 0) {
            if (!this.pageScroller.isDown) {
                if (this.pageScroller.wasDown) {
                    this.pageScroller.wasDown = false;
                }
                if (this.pageScroller.downDistance !== 0) {
                    var threshold = 0.3;
                    var velocity = Math.max(0, threshold - this.pageScroller.downTime) * 1.5;
                    if (velocity) {
                        this.pageScroller.offset += this.pageScroller.downDistance * velocity;
                        this.pageScroller.downTime += elapsed * 0.15;

                        if (this.pageScroller.offset < this.pageScroller.minOffset - this.pageScroller.rowHeight * 1.3) {
                            this.pageScroller.offset = this.pageScroller.minOffset - this.pageScroller.rowHeight * 1.3;
                            this.pageScroller.downTime = threshold;
                        }
                        else if (this.pageScroller.offset > this.pageScroller.maxOffset + this.pageScroller.rowHeight * 1.3) {
                            this.pageScroller.offset = this.pageScroller.maxOffset + this.pageScroller.rowHeight * 1.3;
                            this.pageScroller.downTime = threshold;
                        }
                    }

                    if (this.pageScroller.downTime >= threshold) {
                        this.pageScroller.downDistance = 0;
                    }
                }
            }

            if (!this.pageScroller.isDown) {
                if (this.pageScroller.offset < this.pageScroller.minOffset) {
                    this.pageScroller.offset += this.pageScroller.rowHeight * elapsed * 13;
                    if (this.pageScroller.offset > this.pageScroller.minOffset) {
                        this.pageScroller.offset = this.pageScroller.minOffset;
                    }
                }
                else if (this.pageScroller.offset > this.pageScroller.maxOffset) {
                    this.pageScroller.offset -= this.pageScroller.rowHeight * elapsed * 13;
                    if (this.pageScroller.offset < this.pageScroller.maxOffset) {
                        this.pageScroller.offset = this.pageScroller.maxOffset;
                    }
                }
            }
            else {
                this.pageScroller.wasDown = true;
                this.pageScroller.downTime += elapsed;

                if (this.pageScroller.offset < this.pageScroller.minOffset - this.pageScroller.rowHeight * 1.3) {
                    this.pageScroller.offset = this.pageScroller.minOffset - this.pageScroller.rowHeight * 1.3;
                }
                else if (this.pageScroller.offset > this.pageScroller.maxOffset + this.pageScroller.rowHeight * 1.3) {
                    this.pageScroller.offset = this.pageScroller.maxOffset + this.pageScroller.rowHeight * 1.3;
                }
            }
        }
    }

})(window.MNApp = window.MNApp || {});
