const chalk           = require('chalk');
const format          = require('util').format;
const jfFileSystem    = require('@jf/fs');
const path            = require('path');
const jfTestsTypeUnit = require('../src/type/Unit');
/**
 * Clase para ejecutar todos las pruebas en un archivo.
 *
 * @namespace jf.tests
 * @class     jf.tests.RunTests
 */
module.exports = class RunTests extends jfFileSystem
{
    /**
     * @override
     */
    constructor(filename)
    {
        super();
        /**
         * Clase con la pruebas a ejecutar.
         *
         * @property Class
         * @type     {jf.tests.type.Unit|null}
         */
        this.Class = null;
        /**
         * Objeto donde se almacenan los errores.
         *
         * @property errors
         * @type     {object}
         */
        this.errors = {};
        /**
         * Ruta del archivo de la clase.
         *
         * @property filename
         * @type     {string}
         */
        this.filename = '';
        /**
         * Registro de salida.
         *
         * @property logs
         * @type     {string[]}
         */
        this.logs = [];
        /**
         * Contador de aserciones pasadas con éxito.
         *
         * @property passed
         * @type     {number}
         */
        this.passed = 0;
        //------------------------------------------------------------------------------
        this.load(filename);
    }

    /**
     * Analiza el archivo y ejecuta las pruebas.
     *
     * @param {string} file Ruta del archivo obtenida de la línea de comandos.
     */
    load(file)
    {
        const _filename = path.resolve(file);
        if (this.isFile(_filename))
        {
            this.filename = _filename;
            this.parse(_filename);
        }
        else
        {
            this.constructor.send(
                {
                    error   : 1,
                    message : `Archivo no encontrado: ${chalk.cyan(file)}`
                }
            );
        }
    }

    /**
     * Analiza el archivo y asigna la configuración de las pruebas o el error a mostrar.
     *
     * @param {string} filename Ruta del archivo a leer.
     */
    parse(filename)
    {
        const _class = require(filename);
        if (typeof _class === 'function' && jfTestsTypeUnit.isPrototypeOf(_class))
        {
            const _tests = _class.getTests();
            if (_tests.length)
            {
                this.Class = _class;
                this.tests = _tests;
            }
            else
            {
                this.constructor.send(
                    {
                        error   : 3,
                        message : `El archivo ${chalk.cyan(filename)} no contiene métodos de pruebas`
                    }
                );
            }
        }
        else
        {
            this.constructor.send(
                {
                    error   : 2,
                    message : `El módulo exportado del archivo ${chalk.cyan(filename)} no extiende de ${chalk.green('jfTestsTypeUnit')}`
                }
            );
        }
    }

    /**
     * Ejecuta una prueba existente en una clase.
     *
     * @param {string} test Nombre de la prueba a ejecutar.
     */
    async runTest(test)
    {
        const _Class = this.Class;
        if (_Class)
        {
            const _name     = _Class.format(test);
            const _instance = new _Class();
            _instance.setUp();
            let _icon;
            try
            {
                await _instance[test]();
                _icon = _instance.numAssertions
                    ? chalk.green('✔')
                    : chalk.yellow('-');
            }
            catch (e)
            {
                const _filename = this.filename;
                const _stack    = [];
                for (const _line of e.stack.split('\n').filter(Boolean))
                {
                    _stack.push(_line);
                    if (_line.includes(_filename))
                    {
                        break;
                    }
                }
                this.errors[_name] = chalk.red(_stack.join('\n'));
                _icon              = chalk.red('×');
            }
            const _assertions = _instance.numAssertions;
            this.logs.push(
                format(
                    '    %s %s (%s %s)',
                    _icon,
                    chalk.cyan(_name),
                    _assertions,
                    _assertions > 1 ? 'aserciones' : 'aserción'
                )
            );
            _instance.tearDown();
            this.passed += _assertions;
        }
    }

    /**
     * Ejecuta las pruebas existentes en una clase.
     */
    async run()
    {
        const _errors = this.errors;
        const _tests  = this.tests;
        if (_tests.length)
        {
            const _Class = this.Class;
            if (_Class)
            {
                //------------------------------------------------------------------------------
                // Ejecución de las pruebas
                //------------------------------------------------------------------------------
                const _filename = this.filename;
                const _logs     = this.logs;
                _logs.push(
                    format(
                        '%s (%d %s) %s',
                        chalk.yellow(_Class.title || _Class.name),
                        _tests.length,
                        _tests.length > 1 ? 'pruebas' : 'prueba',
                        chalk.gray(_filename.replace(this.findUp(_filename, 'package.json'), ''))
                    )
                );
                _Class.setUp();
                for (const _test of _tests.sort())
                {
                    await this.runTest(_test);
                }
                _Class.tearDown();
                //------------------------------------------------------------------------------
                // Si hay errores se muestran.
                //------------------------------------------------------------------------------
                const _keys = Object.keys(_errors);
                if (_keys.length)
                {
                    _logs.push(format('\n%s\n', chalk.red('FALLIDOS:')));
                    _keys.forEach(
                        test => _logs.push(format('%s\n%s\n', chalk.red(test), _errors[test].replace(/^/gm, '    ')))
                    );
                }
                process.stdout.write(_logs.join('\n') + '\n\n');
            }
        }
        this.constructor.send(
            {
                failed : Object.keys(_errors).length,
                passed : this.passed,
                total  : _tests.length
            }
        );
    }

    /**
     * Envía los datos del mensaje a la consola o al proceso padre.
     *
     * @param {object} data Datos a enviar.
     */
    static send(data)
    {
        if (typeof process.send === 'function')
        {
            process.send(data);
        }
        else if (data.message)
        {
            console.log(data.message);
        }
        else
        {
            console.log(
                `
Pruebas realizados : %s
Aserciones OK      : %s
Aserciones KO      : %s\n`,
                chalk.yellow(data.total),
                chalk.green(data.passed),
                chalk.red(data.failed)
            );
        }
    }
};
