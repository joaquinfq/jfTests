#!/usr/bin/env node
const chalk           = require('chalk');
const format          = require('util').format;
const jffs            = require('@jf/fs').i();
const path            = require('path');
const jfTestsTypeUnit = require('../src/type/Unit');
let failed            = 0;
let passed            = 0;
let total             = 0;

/**
 * Leer el archivo y devuelve la configuración de las pruebas o el error a mostrar.
 *
 * @param {string} filename Ruta del archivo a leer.
 *
 * @return {object} Configuración construida.
 */
function load(filename)
{
    const _class = require(filename);
    let _config;
    if (typeof _class === 'function' && jfTestsTypeUnit.isPrototypeOf(_class))
    {
        const _tests = _class.getTests();
        if (_tests.length)
        {
            _config = {
                filename,
                Class : _class,
                tests : _tests
            };
        }
        else
        {
            _config = {
                error   : 3,
                message : `El archivo ${chalk.cyan(filename)} no contiene métodos de pruebas`
            };
        }
    }
    else
    {
        _config = {
            error   : 2,
            message : `El módulo exportado del archivo ${chalk.cyan(filename)} no extiende de ${chalk.green('jfTestsTypeUnit')}`
        };
    }
    return _config;
}

/**
 * Analiza el archivo y ejecuta las pruebas.
 *
 * @param {string} file Ruta del archivo obtenida de la línea de comandos.
 *
 * @return {Promise<void>}
 */
async function run(file)
{
    const _filename = path.resolve(file);
    if (jffs.isFile(_filename))
    {
        const _config = load(_filename);
        if (_config.error)
        {
            send(_config);
        }
        else
        {
            await runTests(_config);
        }
    }
    else
    {
        send(
            {
                error   : 1,
                message : `Archivo no encontrado: ${chalk.cyan(file)}`
            }
        );
    }
}

/**
 * Ejecuta una prueba existentes en una clase.
 *
 * @param {function} Class  Clase con la pruebas a ejecutar.
 * @param {string}   test   Nombre de la prueba a ejecutar.
 * @param {object}   errors Objeto donde se almacenan los errores.
 * @param {string[]} logs   Registro de salida.
 */
async function runTest(Class, test, errors = {}, logs = [])
{
    const _name     = Class.format(test);
    const _instance = new Class();
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
        const _stack = [];
        for (const _line of e.stack.split('\n').filter(Boolean))
        {
            if (_stack.length > 4 && _line.includes('/jfTests/'))
            {
                break;
            }
            else
            {
                _stack.push(_line);
            }
        }
        errors[_name] = chalk.red(_stack.join('\n'));
        _icon         = chalk.red('×');
    }
    const _assertions = _instance.numAssertions;
    logs.push(
        format(
            '    %s %s (%s %s)',
            _icon,
            chalk.cyan(_name),
            _assertions,
            _assertions > 1 ? 'aserciones' : 'aserción'
        )
    );
    _instance.tearDown();
    return _assertions;
}

/**
 * Ejecuta las pruebas existentes en una clase.
 *
 * @param {function} Class    Clase con las pruebas a ejecutar.
 * @param {string}   filename Ruta del archivo de la clase.
 * @param {string[]} tests    Nombre de las pruebas a ejecutar.
 */
async function runTests({ Class, filename, tests })
{
    //------------------------------------------------------------------------------
    // Ejecución de las pruebas
    //------------------------------------------------------------------------------
    let _assertions = 0;
    const _errors   = {};
    const _logs     = [
        format(
            '%s (%d %s) %s',
            chalk.yellow(Class.title || Class.name),
            tests.length,
            tests.length > 1 ? 'pruebas' : 'prueba',
            chalk.gray(filename.replace(jffs.findUp(filename, 'package.json'), ''))
        )
    ];
    Class.setUp();
    for (const _test of tests.sort())
    {
        _assertions += await runTest(Class, _test, _errors, _logs);
    }
    Class.tearDown();
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
    failed += _keys.length;
    passed += _assertions;
    total += tests.length;
}

function send(config)
{
    if (typeof process.send === 'function')
    {
        process.send(config);
    }
    else if (config.message)
    {
        console.log(config.message);
    }
    else
    {
        console.log(
            `
Pruebas realizados : %s
Aserciones OK      : %s
Aserciones KO      : %s\n`,
            chalk.yellow(total),
            chalk.green(passed),
            chalk.red(failed)
        );
    }
}

const files = process.argv.slice(2);
if (files.length)
{
    Promise
        .all(files.map(run))
        .then(() => send({ failed, passed, total }));
}
else
{
    send(
        {
            error   : 5,
            message : 'Se debe especificar el archivo de pruebas'
        }
    );
}
