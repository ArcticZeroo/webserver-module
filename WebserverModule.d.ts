/// <reference types="node" />
/// <reference types="mongoose" />
/// <reference types="express" />
import * as EventEmitter from 'events';
import * as Collection from '@arcticzeroo/djs-collection';
import * as Logger from 'frozor-logger';
import { Application, Router } from 'express';
import { Connection } from 'mongoose';
export default abstract class WebserverModule extends EventEmitter {
    private readonly _name;
    db: Connection;
    app: Application & Router;
    startByDefault: boolean;
    log: Logger;
    children: Collection;
    parent?: WebserverModule;
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
    protected constructor({db, app, startByDefault, name}: {
        db?: Connection;
        app: Router & Application;
        startByDefault?: boolean;
        name?: string;
    });
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
    readonly name: string;
    /**
     * Load a child module into this module's children.
     * @param otherModule
     * @param {object} [data] - Data to load into this child. By default all props from 'this' are passed, excluding name.
     * @return {*} the child that was loaded
     */
    loadChild(otherModule: WebserverModule, data?: {}): any;
    loadChild(otherModule: new (data?: {}) => WebserverModule, data?: {}): any;
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
