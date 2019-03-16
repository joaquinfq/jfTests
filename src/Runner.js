const chalk           = require('chalk');
const jfFileSystem    = require('jf-file-system');
const jfTestsTypeUnit = require('./type/Unit');
const path            = require('path');

/**
 * Realiza las pruebas unitarias existentes en los archivos de un directorio.
 *
 * @namespace jf.tests
 * @class     jf.tests.Runner
 */
class jfTestsRunner extends jfFileSystem
{
    /**
     * @override
     */
    constructor(...args)
    {
        super(...args);
        this.failed = 0;
        this.passed = 0;
        this.total  = 0;
    }

    /**
     * Examina y carga todas las pruebas encontradas en un directorio de manera recursiva.
     *
     * @param {string} directory Ruta donde se buscarán las pruebas a ejecutar.
     *
     * @return {object[]} Listado de pruebas encontradas.
     */
    loadFromDirectory(directory)
    {
        const _classes = [];
        this.scandir(directory).forEach(
            filename =>
            {
                const _class = require(filename);
                if (typeof _class === 'function' && jfTestsTypeUnit.isPrototypeOf(_class))
                {
                    const _tests = _class.getTests();
                    if (_tests.length)
                    {
                        _classes.push(
                            {
                                filename,
                                Class : _class,
                                tests : _tests
                            }
                        );
                    }
                }
            }
        );

        return _classes;
    }

    /**
     * Ejecuta una prueba existentes en una clase.
     *
     * @param {function} Class  Clase con la pruebas a ejecutar.
     * @param {string}   test   Nombre de la prueba a ejecutar.
     * @param {object}   errors Objeto donde se almacenan los errores.
     */
    async runTest(Class, test, errors = {})
    {
        const _name     = Class.format(test);
        const _fmt      = chalk.cyan(_name);
        const _stdout   = process.stdout;
        const _instance = new Class();
        _instance.setUp();
        _stdout.write(`    . ${_fmt}\r`);
        let _icon;
        try
        {
            await _instance[test]();
            _icon = chalk.green('✔');
        }
        catch (e)
        {
            errors[_name] = e.message;
            _icon         = chalk.red('×');
        }
        const _numAssertions = _instance.numAssertions;
        _stdout.write(`    ${_icon} ${_fmt} ${chalk.gray(` (${_numAssertions} aserciones)`)}\n`);
        _instance.tearDown();

        return _numAssertions;
    }

    /**
     * Ejecuta las pruebas existentes en una clase.
     *
     * @param {function} Class    Clase con las pruebas a ejecutar.
     * @param {string}   filename Ruta del archivo de la clase.
     * @param {string[]} tests    Nombre de las pruebas a ejecutar.
     */
    async runTests({ Class, filename, tests })
    {
        console.log('%s (%d pruebas) %s', chalk.yellow(Class.title || Class.name), tests.length, chalk.gray(filename));
        //------------------------------------------------------------------------------
        // Ejecución de las pruebas
        //------------------------------------------------------------------------------
        let _assertions = 0;
        const _errors   = {};
        Class.setUp();
        for (const _test of tests.sort())
        {
            _assertions += await this.runTest(Class, _test, _errors);
        }
        Class.tearDown();
        //------------------------------------------------------------------------------
        // Si hay errores se muestran.
        //------------------------------------------------------------------------------
        const _keys = Object.keys(_errors);
        if (_keys.length)
        {
            console.log('\n%s\n', chalk.red('FALLIDOS:'));
            _keys.forEach(
                test => console.log('%s\n%s\n', chalk.red(test), _errors[test].replace(/^/gm, '    '))
            );
        }
        this.failed += _keys.length;
        this.passed += _assertions;
        this.total += tests.length;
    }

    /**
     * Ejecuta todos las pruebas encontradas en los archivos del directorio de manera recursiva.
     *
     * @param {string|null} directory Directorio donde se buscarán los archivos con las pruebas.
     */
    async run(directory = null)
    {
        const _rootDir  = this.findUp(
            directory
                ? path.resolve(directory)
                : process.cwd(),
            'package.json'
        );
        const _testsDir = path.join(_rootDir, 'tests');
        if (this.isDirectory(_testsDir))
        {
            const _classes = this.loadFromDirectory(_testsDir).map(
                ({Class, filename, tests}) => ({
                    Class,
                    tests,
                    filename : filename.replace(_rootDir, '')
                })
            );
            if (_classes.length)
            {
                await Promise.all(
                    _classes.map(this.runTests, this)
                );
                console.log(
                    `\n
Pruebas realizados : %s
Aserciones OK      : %s
Aserciones KO      : %s\n`,
                    chalk.yellow(this.total),
                    chalk.green(this.passed),
                    chalk.red(this.failed)
                );
            }
            else
            {
                console.log('No se encontraron archivos de pruebas dentro del directorio %s', chalk.cyan(_testsDir));
            }
        }
        else
        {
            console.log('El directorio %s no existe', chalk.cyan(_testsDir));
        }
    }
}

jfTestsRunner.i().run();
module.exports = jfTestsRunner;
