const assert = require('assert').strict;
/**
 * Clase base para las pruebas unitarias a realizar.
 *
 * @namespace jf.tests
 * @class     jf.tests.Unit
 */
module.exports = class jfTestsUnit
{
    /**
     * Devuelve el título de las pruebas de la clase.
     *
     * @property title
     * @type     {string}
     */
    static get title()
    {
        return '';
    }

    /**
     * Constructor de la clase.
     */
    constructor()
    {
        /**
         * Cantidad de aserciones evaluadas.
         *
         * @property numAssertions
         * @type     {number}
         */
        this.numAssertions = 0;
        /**
         * Sujeto bajo prueba.
         *
         * @property sut
         * @type     {*}
         */
        this.sut = null;
    }

    /**
     * Evalúa la aserción incrementando el contador de las aserciones.
     *
     * @param {string} fn   Nombre de la aserción a evaluar.
     * @param {array}  args Argumentos que acepta la aserción.
     *
     * @protected
     */
    _assert(fn = 'deepStrictEqual', ...args)
    {
        assert[fn || 'deepStrictEqual'](...args);
        ++this.numAssertions;
    }

    /**
     * Método que se llama antes de lanzar cada prueba de la clase.
     */
    setUp()
    {
    }

    /**
     * Método que se llama al finalizar cada prueba de la clase.
     */
    tearDown()
    {
    }

    /**
     * Permite formatear los nombres de los métodos que empiezan por `test`.
     *
     * @param {string} name Nombre del método a formatear.
     *
     * @return {string} Nombre formateado del método.
     */
    static format(name)
    {
        return name.substr(4);
    }

    /**
     * Devuelve valores para todos los tipos de datos existentes en JS.
     *
     * @return {*[]}
     */
    static getAllTypes()
    {
        return [
            undefined,
            null,
            false,
            true,
            -1.01,
            -1,
            0,
            1,
            1.01,
            '',
            'abcdefghijklmnopqrstuvwxyz',
            {},
            { a : 1, b : 2 },
            [],
            [0, 1, 2],
            () => null,
            () => false,
            () => 1,
            function ()
            {
            },
            class
            {
            }
        ];
    }

    /**
     * Devuelve todas las pruebas a realizar.
     *
     * @return {string[]} Nombre con los métodos que se deberán ejecutar en las pruebas.
     */
    static getTests()
    {
        const _proto = this.prototype;

        return Object.getOwnPropertyNames(_proto)
            .filter(
                name => name.startsWith('test') && typeof _proto[name] === 'function'
            );
    }

    /**
     * Método que se llama antes de lanzar todas las pruebas de la clase.
     */
    static setUp()
    {
    }

    /**
     * Método que se llama al finalizar todas las pruebas de la clase.
     */
    static tearDown()
    {
    }
};
