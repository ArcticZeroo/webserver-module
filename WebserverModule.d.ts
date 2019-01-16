/// <reference types="node" />
import EventEmitter from 'events';
import Logger from 'frozor-logger';
import Collection from '@arcticzeroo/collection';
import { Router } from 'express';
import Database from 'fast-mongoose';
export interface IWebserverModuleParams {
    db?: Database;
    app: Router;
    startByDefault?: boolean;
    name?: string;
    loaderModule?: WebserverModule;
    routerPath?: string;
}
declare type WebserverModuleLike<T> = WebserverModule<T> | (new (data: IWebserverModuleParams & T) => WebserverModule<T>);
export default abstract class WebserverModule<T = {}> extends EventEmitter {
    private static readonly isWebserverModuleProperty;
    private readonly _name?;
    db?: Database;
    app: Router;
    startByDefault: boolean;
    log: Logger;
    children: Collection<string, WebserverModule>;
    parent?: WebserverModule;
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
    constructor(data: IWebserverModuleParams & T);
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
     * @param {WebserverModuleLike} otherModule - The constructor or instance of a webserver module to add to this parent
     * @param [data] - Data to load into this child. By default all props from 'this' are passed, excluding name.
     * @return {*} the child that was loaded
     */
    loadChild<TChild = {}>(otherModule: WebserverModuleLike<TChild>, data?: Partial<IWebserverModuleParams> & TChild): WebserverModule<TChild>;
    loadChildren<TChild = {}>(modules: Array<WebserverModuleLike<TChild>>, data?: Partial<IWebserverModuleParams> & TChild): WebserverModule<TChild>[];
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
    static isWebserverModule(obj: any): obj is WebserverModule;
}
export {};
