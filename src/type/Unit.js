const assert = require('assert').strict;
const sleep  = require('util').promisify(setTimeout);
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
        /**
         * Cantidad de números a generar por defecto.
         *
         * @property totalNumbers
         * @type {number}
         */
        this.totalNumbers = 100;
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
     * Verifica que los valores sean idénticos.
     *
     * @param {*}       actual   Valor actual.
     * @param {*}       expected Valor esperado.
     * @param {string?} message  Mensaje a mostrar.
     */
    assertEqual(actual, expected, message)
    {
        this._assert('strictEqual', actual, expected, message)
    }

    /**
     * Verifica que el valor sea `false`.
     *
     * @param {*}       value   Valor a verificar.
     * @param {string?} message Mensaje a mostrar.
     */
    assertFalse(value, message)
    {
        this._assert('ok', value === false, message)
    }

    /**
     * Verifica que el valor sea `null`.
     *
     * @param {*}       value   Valor a verificar.
     * @param {string?} message Mensaje a mostrar.
     *
     * @protected
     */
    assertNull(value, message)
    {
        this._assert('ok', value === null, message)
    }

    /**
     * Verifica que el valor sea un objeto.
     *
     * @param {*}       value   Valor a verificar.
     * @param {string?} message Mensaje a mostrar.
     *
     * @protected
     */
    assertObject(value, message)
    {
        this._assert('ok', !!value && typeof value === 'object' && !Array.isArray(values), message)
    }

    /**
     * Verifica que el valor sea `true`.
     *
     * @param {*}       value   Valor a verificar.
     * @param {string?} message Mensaje a mostrar.
     *
     * @protected
     */
    assertTrue(value, message)
    {
        this._assert('ok', value === true, message)
    }

    /**
     * Verifica que el valor sea `undefined`.
     *
     * @param {*}       value   Valor a verificar.
     * @param {string?} message Mensaje a mostrar.
     *
     * @protected
     */
    assertUndefined(value, message)
    {
        this._assert('ok', value === undefined, message)
    }

    /**
     * Formatea una fecha en formato ISO sin incluir las horas y sin tomar en cuenta el huso horario.
     *
     * @param {Date} date Fecha a formatear.
     *
     * @return {string} Fecha formateada.
     */
    formatDate(date)
    {
        return [
            date.getFullYear(),
            this.pad(date.getMonth() + 1),
            this.pad(date.getDate())
        ].join('-');
    }

    /**
     * Devuelve formateada la hora de una fecha sin tomar en cuenta el huso horario.
     *
     * @param {Date} date Fecha a formatear.
     *
     * @return {string} Hora formateada.
     */
    formatTime(date)
    {
        return [
            this.pad(date.getHours()),
            this.pad(date.getMinutes()),
            this.pad(date.getSeconds())
        ].join(':');
    }

    /**
     * Genera un listado de números aleatorios.
     *
     * @param {number} max Máximo valor a generar.
     * @param {number} min Mínimo valor a generar.
     *
     * @return {number[]} Listado de números generados.
     */
    generateNumbers(max = 1.0e7, min = 0)
    {
        const _numbers = [];
        for (let _i = 0; _i < this.totalNumbers; ++_i)
        {
            _numbers.push((max - min) * Math.random() + min);
        }
        return _numbers;
    }

    /**
     * Permite rellenar el valor con un carácter por la izquierda.
     *
     * @param {*}      value  Valor a rellenar.
     * @param {number} length Longitud máxima del texto resultante.
     * @param {string} char   Carácter a usar para rellenar.
     *
     * @return {string} Texto rellenado.
     */
    pad(value, length = 2, char = '0')
    {
        return String(value).padStart(length, char);
    }

    /**
     * Método que se llama antes de lanzar cada prueba de la clase.
     */
    setUp()
    {
    }

    /**
     * Permite esperar en una prueba un tiempo en milisegundos.
     *
     * @param {number} ms Tiempo de espera en milisegundos.
     *
     * @return {Promise<void>} Promesa para realizar la espera.
     */
    async sleep(ms = 100)
    {
        return sleep(ms);
    }

    /**
     * Método que se llama al finalizar cada prueba de la clase.
     */
    tearDown()
    {
    }

    /**
     * Permite verificar la definición de una clase para evitar cualquier cambio accidental.
     *
     * @param {Function} Class       Referencia de la clase a verificar.
     * @param {object}   staticProps Propiedades de clase esperadas.
     * @param {object}   props       Propiedades de instancia esperadas.
     *
     * @protected
     */
    _testDefinition(Class, staticProps, props)
    {
        if (staticProps)
        {
            this._testObject(Class, staticProps, Class.name);
        }
        if (props)
        {
            this._testObject(new Class(), props, Class.name);
        }
    }

    /**
     * Realiza algunas comprobaciones de la herencia entre clases.
     *
     * @param {Function}   Class   Referencia de la clase a verificar.
     * @param {Function}   Super   Referencia de la clase de la que se espera que descienca `Class`.
     * @param {jf.Factory} factory Si se usa una factoría, se verifica que se haya registrado la clase.
     *
     * @protected
     */
    _testInheritance(Class, Super, factory = null)
    {
        const _classname = Class.name;
        const _sut       = new Class();
        this._assert('ok', _sut instanceof Class);
        if (Super)
        {
            const _supername = Super.name;
            this._assert('ok', Super.isPrototypeOf(Class), `${_classname} extends ${_supername}`);
            this._assert('ok', _sut instanceof Super);
        }
        if (factory)
        {
            // Al registrar el nombre en la factoría se suele usar el nombre completo o una parte
            // que suele ir desde el final hacia al principio así que buscamos esa coincidencia.
            // Por ejemplo:
            // jfDataTypeDate      se registra como Date
            // jfDataTypeDateTime  se registra como DateTime
            let _sut;
            const _names = _classname.match(/[A-Z][a-z0-9]+/g);
            while (_names.length)
            {
                _sut = factory.create(_names.join(''));
                if (_sut)
                {
                    break;
                }
                else
                {
                    _names.shift();
                }
            }
            this._assert('ok', _sut instanceof Class);
            if (Super)
            {
                this._assert('ok', _sut instanceof Super);
            }
        }
    }

    /**
     * Verifica que las claves esperadas existan en el objeto y con los valores esperados.
     *
     * @param {object} object      Objeto a verificar.
     * @param {object} values      Valores a verificar.
     * @param {string} description Descripción de la prueba.
     *
     * @protected
     */
    _testObject(object, values, description = '')
    {
        for (const _key of Object.keys(values))
        {
            const _actual   = object[_key];
            const _expected = values[_key];
            this._assert(
                '',
                _actual,
                _expected,
                `${description}: ${_key} -- ${JSON.stringify(_actual)} !== ${JSON.stringify(_expected)}`
            );
        }
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
        let _proto = this.prototype;
        const _items = [];
        while (_proto)
        {
            _items.push(
                ...Object.getOwnPropertyNames(_proto).filter(
                    name => name.startsWith('test') && typeof _proto[name] === 'function' && !_items.includes(name)
                )
            );
            _proto = _proto.__proto__;
        }

        return _items;
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
