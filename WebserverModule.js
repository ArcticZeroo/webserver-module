"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const frozor_logger_1 = __importDefault(require("frozor-logger"));
const collection_1 = __importDefault(require("@arcticzeroo/collection"));
const express = require("express");
class WebserverModule extends events_1.default {
    /**
     * Creates a new instance of a Webserver Module.
     * <p>
     * This module should be independent from other modules
     * not included in this repo/package/whatever the module
     * is contained in. If the module creates and starts other
     * modules, that's OK.
     * <p>
     * The purpose of one of these modules is to provide additional
     * functionality to the BASE webserver (i.e. frozor.io without
     * subdomains or etc) without requiring the related code to be
     * stored inside the webserver's repo, which is getting to be
     * rather monolithic right now.
     * <p>
     * In a new module project, simply extend a WebserverModule and
     * export it. You SHOULD NOT instantiate it, this will be taken
     * care of entirely by the webserver itself.
     * <p>
     * Constructor properties are not in any order, they should be given as an object with the property names listed below.
     * @param {object} db - An instance of a db. I use mongodb for this, with fast-mongoose such that the db has all schemas on it as props.
     * @param {object} app - An instance of an express app. Though it is not required in IWebserverModuleParams, it is required for the constructor
     * @param {boolean} startByDefault - Whether this module should start listening without additional method calls, default true
     * @param {string} name - The name of this module. Not required. The logger will use this name if you give it one.
     * @param {string} routerPath - The optional path for a router for this module. If this is passed, this.app will be a "scoped router" rather than a root level one
     * @param {WebserverModule} loaderModule - The parent loading this module, if available
     */
    constructor({ db, app, startByDefault = true, name, routerPath, loaderModule }) {
        super();
        Object.defineProperty(this, WebserverModule.isWebserverModuleProperty, { value: true });
        this._name = name;
        this.db = db;
        this.startByDefault = startByDefault;
        this.log = new frozor_logger_1.default(this.name);
        this.children = new collection_1.default();
        if (routerPath) {
            const router = express.Router();
            app.use(routerPath, router);
            this.app = router;
        }
        else {
            this.app = app;
        }
        if (loaderModule) {
            this.parent = loaderModule;
        }
        if (startByDefault) {
            this.start();
        }
    }
    /**
     * Get this instance's name. If the name was set
     * on instantiation or with .name's setter, this
     * will be that. Otherwise, it'll be the constructor
     * name (IE the name of the class). This is used
     * primarily for the Logger, but also for getting
     * a given child from the Collection of children
     * that each module contains
     * @return {string|*}
     */
    get name() {
        return this._name || this.constructor.name;
    }
    /**
     * Load a child module into this module's children.
     * @param {WebserverModuleLike} otherModule - The constructor or instance of a webserver module to add to this parent
     * @param [data] - Data to load into this child. By default all props from 'this' are passed, excluding name.
     * @return {*} the child that was loaded
     */
    loadChild(otherModule, data = {}) {
        if (!(otherModule instanceof WebserverModule)) {
            // Assume this is a class that can be
            // newly constructed if it's a function
            if (typeof otherModule === 'function') {
                // Load props from this, set name to null so that it gets its name from constructor
                // if data is provided, and load data last so it can override anything we've provided
                // already.
                otherModule = new otherModule(Object.assign({ loaderModule: this }, this, { name: null }, data));
            }
            else {
                throw new TypeError(`Invalid type given for module loading: ${typeof otherModule}`);
            }
            // Still not a webserver module instance
            if (typeof otherModule[WebserverModule.isWebserverModuleProperty] === 'undefined' && !(otherModule instanceof WebserverModule)) {
                throw new TypeError('Module given to load should be a WebserverModule.');
            }
        }
        otherModule.parent = this;
        this.children.set(otherModule.name, otherModule);
        return otherModule;
    }
    loadChildren(modules, data) {
        return modules.map(module => this.loadChild(module, data));
    }
}
WebserverModule.isWebserverModuleProperty = '__webserverModule';
exports.default = WebserverModule;
//# sourceMappingURL=WebserverModule.js.map