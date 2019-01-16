import EventEmitter from 'events';
import Logger from 'frozor-logger';
import Collection from '@arcticzeroo/collection';
import { Router } from 'express';
import express = require('express');
import Database from 'fast-mongoose';

export interface IWebserverModuleParams {
    db?: Database;
    app: Router;
    startByDefault?: boolean;
    name?: string;
    loaderModule?: WebserverModule;
    routerPath?: string;
}

type WebserverModuleLike<T> = WebserverModule<T> | (new (data: IWebserverModuleParams & T) => WebserverModule<T>);

export default abstract class WebserverModule<T = {}> extends EventEmitter {
    private static readonly isWebserverModuleProperty = '__webserverModule';
    private readonly _name?: string;
    public db?: Database;
    public app: Router;
    public startByDefault: boolean;
    public log: Logger;
    public children: Collection<string, WebserverModule>;
    public parent?: WebserverModule;
    protected readonly data: IWebserverModuleParams & T;

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
     * @param {IWebserverModuleParams<T> & T>} data
     */
    constructor(data: IWebserverModuleParams & T) {
        super();

        Object.defineProperty(this, WebserverModule.isWebserverModuleProperty, { value: true });

        if (typeof data.startByDefault === 'undefined') {
            data.startByDefault = true;
        }

        const { db, app, startByDefault, name, routerPath, loaderModule } = data;
        this.data = data;

        this._name = name;
        this.db = db;
        this.startByDefault = startByDefault;
        this.log = new Logger(this.name);
        this.children = new Collection();

        if (routerPath) {
            const router = express.Router();
            app.use(routerPath, router);
            this.app = router;
        } else {
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
    get name(): string {
        return this._name || this.constructor.name;
    }

    /**
     * Load a child module into this module's children.
     * @param {WebserverModuleLike} otherModule - The constructor or instance of a webserver module to add to this parent
     * @param [data] - Data to load into this child. By default all props from 'this' are passed, excluding name.
     * @return {*} the child that was loaded
     */
    // @ts-ignore - We don't care that the default value is not assignable to TChild because the data needs to be added
    // if the module is not a generic of anything that's not {}...
    loadChild<TChild = {}>(otherModule: WebserverModuleLike<TChild>, data: Partial<IWebserverModuleParams> & TChild = {}): WebserverModule<TChild> {
        if (!WebserverModule.isWebserverModule(otherModule)) {
            // Assume this is a class that can be
            // newly constructed if it's a function
            if (typeof otherModule === 'function') {
                // Load props from this, set name to null so that it gets its name from constructor
                // if data is provided, and load data last so it can override anything we've provided
                // already.
                otherModule = new otherModule({ ...this.data, loaderModule: this, name: null, ...data });
            } else {
                throw new TypeError(`Invalid type given for module loading: ${typeof otherModule}`);
            }

            // Still not a webserver module instance
            if (!WebserverModule.isWebserverModule(otherModule)) {
                throw new TypeError('Module given to load should be a WebserverModule.');
            }
        }

        otherModule.parent = this;

        this.children.set(otherModule.name, otherModule);

        return otherModule;
    }

    loadChildren<TChild = {}>(modules: Array<WebserverModuleLike<TChild>>, data?: Partial<IWebserverModuleParams> & TChild): WebserverModule<TChild>[] {
       return modules.map(module => this.loadChild(module, data));
    }

    /**
     * This method is to be called when the module is
     * supposed to start listening. By default it is
     * called when the module is instantiated. Do whatever
     * you want here.
     * <p>
     * If you plan to loadChild children into your module,
     * do it here.
     */
    abstract start(): void;

    static isWebserverModule(obj: any): obj is WebserverModule {
        return typeof obj[WebserverModule.isWebserverModuleProperty] !== 'undefined' || obj instanceof WebserverModule;
    }
}