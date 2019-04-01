const chalk    = require('chalk');
const jffs     = require('@jf/fs').i();
const Mustache = require('mustache');
const path     = require('path');

function capitalize(text)
{
    return text[0].toUpperCase() + text.substr(1);
}

function getFunctions(object, prefix = '')
{
    return Object
        .getOwnPropertyNames(object)
        .filter(property => property[0] !== '_' && property[0] !== '$' && typeof object[property] === 'function')
        .map(
            method => (
                {
                    method,
                    static : prefix === 'Static',
                    test   : `test${prefix}${capitalize(method)}`
                }
            )
        );
}

function sortMethods(method1, method2)
{
    return method1.test.localeCompare(method2.test);
}

const filenames = process.argv.slice(2);
if (filenames.length)
{
    const tpl = jffs.read(
        path.join(__dirname, '..', 'tpl', 'class.hbs')
    );
    filenames.forEach(
        filename =>
        {
            if (jffs.exists(filename))
            {
                const _Class   = require(filename);
                const _methods = [
                    ...getFunctions(_Class, 'Static'),
                    ...getFunctions(_Class.prototype)
                ];
                if (_methods.length)
                {
                    _methods.sort(sortMethods);
                    const _content = jffs.read(filename);
                    const _class   = _content.match(/@class\s+(\S+)/s);
                    const _dir     = jffs.findUp(filename, 'package.json');
                    const _file    = filename.replace(_dir, '');
                    const _outfile = path.join(_dir, _file.replace(/^\/src\//, 'tests/'));
                    const _outdir  = path.dirname(_outfile);
                    const _config  = {
                        dir     : _dir,
                        infile  : path.relative(_outdir, filename).replace(new RegExp('\\' + path.extname(filename) + '$'), ''),
                        name    : _Class.name,
                        title   : _class ? _class[1] : _file,
                        methods : _methods
                    };
                    const _super   = _Class.__proto__.name;
                    if (_super)
                    {
                        _config.super = _super;
                        const _match  = _content.match(new RegExp(`${_super}\\s+=\\s+require\\(['"](.+?)['"]\\)`));
                        if (_match)
                        {
                            const _require  = _match[1];
                            _config.insuper = path.relative(
                                _outdir,
                                path.resolve(
                                    path.dirname(filename),
                                    ..._require.replace(new RegExp('\\' + path.extname(_require) + '$'), '').split('/')
                                )
                            );
                        }
                    }
                    const _code = Mustache.render(tpl, _config);
                    if (jffs.exists(_outfile))
                    {
                        console.log('El archivo %s existe!!!\n%s\n', chalk.cyan(_outfile), _code);
                    }
                    else
                    {
                        jffs.write(_outfile, _code);
                    }
                }
                else
                {
                    console.warn('Archivo sin métodos que probar: %s', chalk.cyan(filename));
                }
            }
            else
            {
                console.warn('Archivo no encontrado: %s', chalk.cyan(filename));
            }
        }
    );
}
else
{
    console.error('Se debe especificar la ruta del archivo que se usará para generar las pruebas.');
}
