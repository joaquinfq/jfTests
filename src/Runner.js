const chalk           = require('chalk');
const fork            = require('child_process').fork;
const jfFileSystem    = require('@jf/fs');
const jfTestsTypeUnit = require('./type/Unit');
const path            = require('path');

/**
 * Realiza las pruebas unitarias existentes en los archivos de un directorio.
 *
 * @namespace jf.tests
 * @class     jf.tests.Runner
 */
module.exports = class jfTestsRunner extends jfFileSystem
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
        const _filenames = [];
        this.scandir(directory)
            .filter(
                // Verificamos que ni el nombre del archivo ni los subdirectorios empiecen por _.
                filename => /\.m?js$/i.test(filename) && filename
                    .replace(directory, '')
                    .split(path.sep)
                    .every(part => part[0] !== '_')
            )
            .forEach(
                filename =>
                {
                    const _class = require(filename);
                    if (typeof _class === 'function' && jfTestsTypeUnit.isPrototypeOf(_class))
                    {
                        _filenames.push(filename);
                    }
                }
            );

        return _filenames;
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
            const _filenames = this.loadFromDirectory(_testsDir);
            if (_filenames.length)
            {
                process.on(
                    'exit',
                    () =>
                    {
                        console.log(
                            `
Pruebas realizados : %s
Aserciones OK      : %s
Aserciones KO      : %s\n`,
                            chalk.yellow(this.total),
                            chalk.green(this.passed),
                            chalk.red(this.failed)
                        );
                    }
                );
                const _script = path.join(__dirname, '..', 'scripts', 'run-test.js');
                _filenames.forEach(
                    filename =>
                    {
                        const _subprocess = fork(_script, [filename]);
                        _subprocess.on(
                            'message',
                            msg =>
                            {
                                if (msg.error)
                                {
                                    console.log('ERROR %d (%s) - %s', msg.error, filename, msg.message)
                                }
                                else
                                {
                                    Object.keys(msg).forEach(
                                        key =>
                                        {
                                            const _value = msg[key];
                                            if (typeof _value === 'number' && key in this)
                                            {
                                                this[key] += _value;
                                            }
                                        }
                                    )
                                }
                            }
                        );
                    }
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
};
