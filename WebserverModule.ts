import * as EventEmitter from 'events';
import * as Collection from '@arcticzeroo/djs-collection';
import * as Logger from 'frozor-logger';
import { Application, Router } from 'express';

export default abstract class WebserverModule extends EventEmitter {
    private readonly _name: string;
    public db;
    public app: Application & Router;
    public startByDefault: boolean;
    public log: Logger;
    public children: Collection;
    public parent?: WebserverModule;

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
     * @param {object} app - An instance of an express app
     * @param {boolean} startByDefault - Whether this module should start listening without additional method calls, default true
     * @param {string} name - The name of this module. Not required. The logger will use this name if you give it one.
     */
    protected constructor({ db, app, startByDefault = true, name }) {
        super();

        this._name = name;
        this.db = db;
        this.app = app;
        this.startByDefault = startByDefault;
        this.log = new Logger(this.name);
        this.children = new Collection();

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
     * @param otherModule
     * @param {object} [data] - Data to load into this child. By default all props from 'this' are passed, excluding name.
     * @return {*} the child that was loaded
     */
    loadChild(otherModule, data): any {
        if (!(otherModule instanceof WebserverModule)) {
            // Assume this is a class that can be
            // newly constructed if it's a function
            if (typeof otherModule === 'function') {
                // Load props from this, set name to null so that it gets its name from constructor
                // if data is provided, and load data last so it can override anything we've provided
                // already.
                // @ts-ignore
                otherModule = new otherModule({ loaderModule: this, ...this, name: null, ...data });
            } else {
                throw new TypeError(`Invalid type given for module loading: ${typeof otherModule}`);
            }

            // Still not a webserver module instance
            if (!(otherModule instanceof WebserverModule)) {
                throw new TypeError('Module given to load should be a WebserverModule.');
            }
        }

        otherModule.parent = this;

        this.children.set(otherModule.name, otherModule);

        return otherModule;
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
}